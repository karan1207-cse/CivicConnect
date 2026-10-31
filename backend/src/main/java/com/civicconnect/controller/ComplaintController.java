package com.civicconnect.controller;

import com.civicconnect.model.Complaint;
import com.civicconnect.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintRepository repo;
    @Value("${gemini.api.key:}")
    private String apiKey;

    public ComplaintController(ComplaintRepository repo) {
        this.repo = repo;
    }

    public Map<String, String> analyze(String text) {
        String t = (text != null ? text : "").toLowerCase();
        String cat = "OTHER", prio = "LOW";
        if (t.contains("pothole") || t.contains("road") || t.contains("traffic") || t.contains("bridge")) {
            cat = "ROADS"; prio = "HIGH";
        } else if (t.contains("water") || t.contains("pipe") || t.contains("leak") || t.contains("drain")) {
            cat = "WATER_SUPPLY"; prio = "HIGH";
        } else if (t.contains("garbage") || t.contains("waste") || t.contains("trash") || t.contains("dump")) {
            cat = "SANITATION"; prio = "MEDIUM";
        } else if (t.contains("power") || t.contains("electricity") || t.contains("light") || t.contains("transformer")) {
            cat = "ELECTRICITY"; prio = "HIGH";
        }
        if (t.contains("danger") || t.contains("urgent") || t.contains("accident") || t.contains("spark")) {
            prio = "URGENT";
        }

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
                String prompt = "Classify civic grievance into JSON {\"category\":\"ROADS|WATER_SUPPLY|SANITATION|ELECTRICITY|OTHER\",\"priority\":\"LOW|MEDIUM|HIGH|URGENT\"}: " + text;
                Map body = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
                new RestTemplate().postForObject(url, body, Map.class);
            } catch (Exception ignored) {}
        }
        return Map.of("category", cat, "priority", prio);
    }

    @PostMapping("/ai-preview")
    public ResponseEntity<?> aiPreview(@RequestBody Map<String, String> req) {
        return ResponseEntity.ok(analyze(req.get("title") + " " + req.get("description")));
    }

    @PostMapping
    public ResponseEntity<?> create(Authentication auth, @RequestBody Map<String, String> req) {
        String title = req.get("title");
        String desc = req.get("description");
        if (title == null || title.isBlank() || desc == null || desc.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title and description are required"));
        }

        Map<String, String> ai = analyze(title + " " + desc);
        String cat = req.getOrDefault("category", ai.get("category"));
        String prio = req.getOrDefault("priority", ai.get("priority"));

        Complaint c = new Complaint(title, desc, cat, prio, auth.getName());
        return ResponseEntity.ok(repo.save(c));
    }

    @GetMapping("/my")
    public ResponseEntity<?> myComplaints(Authentication auth) {
        return ResponseEntity.ok(repo.findByCitizenEmailOrderByCreatedAtDesc(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaint(Authentication auth, @PathVariable Long id) {
        return repo.findById(id).map(c -> {
            boolean isAdminOrOfficer = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_OFFICER"));
            if (!isAdminOrOfficer && !c.getCitizenEmail().equalsIgnoreCase(auth.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body((Object) Map.of("message", "Access denied"));
            }
            return ResponseEntity.ok((Object) c);
        }).orElse(ResponseEntity.notFound().build());
    }
}
