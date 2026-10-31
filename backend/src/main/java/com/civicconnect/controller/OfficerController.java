package com.civicconnect.controller;

import com.civicconnect.model.AuditLog;
import com.civicconnect.model.Complaint;
import com.civicconnect.model.User;
import com.civicconnect.repository.AuditLogRepository;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/officer")
@PreAuthorize("hasAnyRole('OFFICER', 'ADMIN')")
public class OfficerController {

    private final ComplaintRepository complaintRepo;
    private final UserRepository userRepo;
    private final AuditLogRepository auditRepo;

    public OfficerController(ComplaintRepository complaintRepo, UserRepository userRepo, AuditLogRepository auditRepo) {
        this.complaintRepo = complaintRepo;
        this.userRepo = userRepo;
        this.auditRepo = auditRepo;
    }

    @GetMapping("/complaints")
    public ResponseEntity<?> getAssignedComplaints(Authentication auth) {
        Optional<User> officerOpt = userRepo.findByEmail(auth.getName());
        if (officerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User officer = officerOpt.get();
        return ResponseEntity.ok(complaintRepo.findByAssignedOfficerIdOrderByCreatedAtDesc(officer.getId()));
    }

    @PutMapping("/complaints/{id}/status")
    public ResponseEntity<?> updateAssignedComplaintStatus(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> req) {

        Optional<User> officerOpt = userRepo.findByEmail(auth.getName());
        if (officerOpt.isEmpty()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        User officer = officerOpt.get();

        Optional<Complaint> cOpt = complaintRepo.findById(id);
        if (cOpt.isEmpty()) return ResponseEntity.notFound().build();
        Complaint c = cOpt.get();

        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        // Ensure officer can only modify assigned complaint!
        if (!isAdmin && (c.getAssignedOfficerId() == null || !c.getAssignedOfficerId().equals(officer.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Permission denied: You can only modify complaints assigned to you"));
        }

        String newStatus = req.get("status");
        if (newStatus != null && !newStatus.isBlank()) {
            c.setStatus(newStatus.toUpperCase());
        }

        String notes = req.get("resolutionNotes");
        if (notes != null) {
            c.setResolutionNotes(notes);
        }

        Complaint saved = complaintRepo.save(c);

        auditRepo.save(new AuditLog(
                "OFFICER_STATUS_UPDATE",
                auth.getName(),
                String.valueOf(id),
                "Status set to " + c.getStatus() + (notes != null ? ", notes: " + notes : "")
        ));

        return ResponseEntity.ok(saved);
    }
}
