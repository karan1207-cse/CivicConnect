package com.civicconnect.controller;

import com.civicconnect.model.User;
import com.civicconnect.repository.UserRepository;
import com.civicconnect.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepo, BCryptPasswordEncoder encoder, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> req) {
        String role = req.get("role");
        if (role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("OFFICER"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Public registration for ADMIN or OFFICER is prohibited."));
        }

        String email = req.get("email");
        if (email == null || email.isBlank() || userRepo.existsByEmail(email.trim().toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or already registered email address"));
        }

        User user = new User(req.get("name"), email.trim().toLowerCase(), encoder.encode(req.get("password")), "CITIZEN");
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Citizen registered successfully", "email", user.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String password = req.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        Optional<User> opt = userRepo.findByEmail(email.trim().toLowerCase());
        if (opt.isEmpty() || !encoder.matches(password, opt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }

        User user = opt.get();
        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account is deactivated. Please contact an administrator."));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }
}
