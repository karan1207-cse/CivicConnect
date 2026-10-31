package com.civicconnect.controller;

import com.civicconnect.model.AuditLog;
import com.civicconnect.model.Complaint;
import com.civicconnect.model.User;
import com.civicconnect.repository.AuditLogRepository;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ComplaintRepository complaintRepo;
    private final UserRepository userRepo;
    private final AuditLogRepository auditRepo;
    private final BCryptPasswordEncoder encoder;

    public AdminController(ComplaintRepository complaintRepo, UserRepository userRepo,
                           AuditLogRepository auditRepo, BCryptPasswordEncoder encoder) {
        this.complaintRepo = complaintRepo;
        this.userRepo = userRepo;
        this.auditRepo = auditRepo;
        this.encoder = encoder;
    }

    @GetMapping("/complaints")
    public ResponseEntity<?> getAllComplaints() {
        return ResponseEntity.ok(complaintRepo.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/complaints/{id}/assign")
    public ResponseEntity<?> assignComplaint(Authentication auth, @PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<Complaint> cOpt = complaintRepo.findById(id);
        if (cOpt.isEmpty()) return ResponseEntity.notFound().build();
        Complaint c = cOpt.get();

        Long officerId = Long.valueOf(String.valueOf(req.get("officerId")));
        Optional<User> officerOpt = userRepo.findById(officerId);
        if (officerOpt.isEmpty() || !officerOpt.get().getRole().equalsIgnoreCase("OFFICER")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Target user is not a valid Officer"));
        }

        c.setAssignedOfficerId(officerId);
        if ("PENDING".equals(c.getStatus())) c.setStatus("ASSIGNED");
        Complaint saved = complaintRepo.save(c);

        auditRepo.save(new AuditLog("ASSIGN_COMPLAINT", auth.getName(), String.valueOf(id),
                "Assigned to officer: " + officerOpt.get().getName() + " (" + officerOpt.get().getEmail() + ")"));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/complaints/{id}/status")
    public ResponseEntity<?> updateStatus(Authentication auth, @PathVariable Long id, @RequestBody Map<String, String> req) {
        Optional<Complaint> cOpt = complaintRepo.findById(id);
        if (cOpt.isEmpty()) return ResponseEntity.notFound().build();
        Complaint c = cOpt.get();

        if (req.containsKey("status") && !req.get("status").isBlank()) c.setStatus(req.get("status").toUpperCase());
        if (req.containsKey("resolutionNotes")) c.setResolutionNotes(req.get("resolutionNotes"));
        Complaint saved = complaintRepo.save(c);

        auditRepo.save(new AuditLog("ADMIN_STATUS_UPDATE", auth.getName(), String.valueOf(id), "Updated status to " + c.getStatus()));
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(@RequestParam(required = false) String search, @RequestParam(required = false) String role) {
        List<User> list = (search != null && !search.isBlank())
                ? userRepo.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(search.trim(), search.trim())
                : (role != null && !role.isBlank()) ? userRepo.findByRole(role.trim().toUpperCase()) : userRepo.findAll();

        return ResponseEntity.ok(list.stream().map(u -> Map.of(
                "id", u.getId(), "name", u.getName(), "email", u.getEmail(), "role", u.getRole(), "active", u.isActive()
        )).toList());
    }

    @GetMapping("/officers")
    public ResponseEntity<?> getOfficers() {
        return ResponseEntity.ok(userRepo.findByRole("OFFICER").stream()
                .filter(User::isActive).map(u -> Map.of("id", u.getId(), "name", u.getName(), "email", u.getEmail())).toList());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(Authentication auth, @PathVariable Long id, @RequestBody Map<String, Boolean> req) {
        Optional<User> uOpt = userRepo.findById(id);
        if (uOpt.isEmpty()) return ResponseEntity.notFound().build();
        User u = uOpt.get();
        if (u.getEmail().equalsIgnoreCase(auth.getName())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot deactivate your own administrator account"));
        }

        boolean active = req.getOrDefault("active", true);
        u.setActive(active);
        userRepo.save(u);

        auditRepo.save(new AuditLog("USER_STATUS_CHANGE", auth.getName(), String.valueOf(id),
                (active ? "Activated" : "Deactivated") + " user: " + u.getEmail()));
        return ResponseEntity.ok(Map.of("message", "User status updated", "active", active));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(Authentication auth, @PathVariable Long id, @RequestBody Map<String, String> req) {
        Optional<User> uOpt = userRepo.findById(id);
        if (uOpt.isEmpty()) return ResponseEntity.notFound().build();
        User u = uOpt.get();

        String newRole = req.get("role");
        if (newRole == null || (!newRole.equals("CITIZEN") && !newRole.equals("OFFICER") && !newRole.equals("ADMIN"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
        }

        String old = u.getRole();
        u.setRole(newRole);
        userRepo.save(u);

        auditRepo.save(new AuditLog("USER_ROLE_CHANGE", auth.getName(), String.valueOf(id),
                "Changed role of " + u.getEmail() + " from " + old + " to " + newRole));
        return ResponseEntity.ok(Map.of("message", "User role updated", "role", newRole));
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(Authentication auth, @RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank() || userRepo.existsByEmail(email.trim().toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists or invalid"));
        }

        String role = req.getOrDefault("role", "OFFICER").toUpperCase();
        User user = userRepo.save(new User(req.get("name"), email.trim().toLowerCase(), encoder.encode(req.get("password")), role));

        auditRepo.save(new AuditLog("USER_CREATED", auth.getName(), String.valueOf(user.getId()), "Created " + role + ": " + user.getEmail()));
        return ResponseEntity.ok(Map.of("message", "User created", "id", user.getId(), "role", role));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        List<Complaint> allComplaints = complaintRepo.findAll();
        long totalComplaints = allComplaints.size();

        // 1. Calculate real category distribution
        Map<String, Long> catCounts = allComplaints.stream()
                .collect(Collectors.groupingBy(
                        c -> (c.getCategory() == null || c.getCategory().isBlank()) ? "OTHER" : c.getCategory(),
                        Collectors.counting()
                ));

        List<Map<String, Object>> categories = new ArrayList<>();
        catCounts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .forEach(entry -> {
                    long count = entry.getValue();
                    int pct = totalComplaints > 0 ? (int) Math.round((count * 100.0) / totalComplaints) : 0;
                    categories.add(Map.of("name", entry.getKey(), "count", count, "percentage", pct));
                });

        // 2. Calculate real 14-day trend timeline
        LocalDate today = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");
        List<Map<String, Object>> trends = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            long dayPending = 0;
            long dayInProgress = 0;
            long dayResolved = 0;
            long dayTotal = 0;

            for (Complaint c : allComplaints) {
                if (c.getCreatedAt() != null && c.getCreatedAt().toLocalDate().equals(d)) {
                    dayTotal++;
                    String st = c.getStatus() != null ? c.getStatus().toUpperCase() : "PENDING";
                    if ("PENDING".equals(st)) {
                        dayPending++;
                    } else if ("ASSIGNED".equals(st) || "IN_PROGRESS".equals(st)) {
                        dayInProgress++;
                    } else if ("RESOLVED".equals(st)) {
                        dayResolved++;
                    }
                }
            }
            trends.add(Map.of(
                    "date", d.format(fmt),
                    "rawDate", d.toString(),
                    "pending", dayPending,
                    "inProgress", dayInProgress,
                    "resolved", dayResolved,
                    "total", dayTotal
            ));
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("totalComplaints", totalComplaints);
        resp.put("pending", complaintRepo.countByStatus("PENDING"));
        resp.put("assigned", complaintRepo.countByStatus("ASSIGNED"));
        resp.put("inProgress", complaintRepo.countByStatus("IN_PROGRESS"));
        resp.put("resolved", complaintRepo.countByStatus("RESOLVED"));
        resp.put("rejected", complaintRepo.countByStatus("REJECTED"));
        resp.put("activeOfficers", userRepo.findByRole("OFFICER").stream().filter(User::isActive).count());
        resp.put("totalCitizens", userRepo.findByRole("CITIZEN").size());
        resp.put("categories", categories);
        resp.put("trends", trends);

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(auditRepo.findAllByOrderByCreatedAtDesc());
    }
}
