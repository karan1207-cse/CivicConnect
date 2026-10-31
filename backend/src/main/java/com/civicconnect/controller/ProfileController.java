package com.civicconnect.controller;

import com.civicconnect.model.User;
import com.civicconnect.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder;

    public ProfileController(UserRepository userRepo, BCryptPasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        return userRepo.findByEmail(auth.getName())
                .map(u -> ResponseEntity.ok(Map.of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail(),
                        "role", u.getRole(),
                        "active", u.isActive()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(Authentication auth, @RequestBody Map<String, String> req) {
        return userRepo.findByEmail(auth.getName()).map(u -> {
            if (req.containsKey("name") && !req.get("name").isBlank()) {
                u.setName(req.get("name"));
            }
            if (req.containsKey("password") && !req.get("password").isBlank()) {
                u.setPassword(encoder.encode(req.get("password")));
            }
            userRepo.save(u);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully", "name", u.getName()));
        }).orElse(ResponseEntity.notFound().build());
    }
}
