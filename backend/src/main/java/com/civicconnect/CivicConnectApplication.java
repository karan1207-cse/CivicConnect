package com.civicconnect;

import com.civicconnect.model.User;
import com.civicconnect.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class CivicConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicConnectApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedInitialUsers(UserRepository userRepo, BCryptPasswordEncoder encoder) {
        return args -> {
            if (!userRepo.existsByEmail("admin@civicconnect.gov")) {
                userRepo.save(new User("Municipal Admin", "admin@civicconnect.gov", encoder.encode("Admin@123"), "ADMIN"));
            }
            if (!userRepo.existsByEmail("officer@civicconnect.gov")) {
                userRepo.save(new User("Field Officer John", "officer@civicconnect.gov", encoder.encode("Officer@123"), "OFFICER"));
            }
            if (!userRepo.existsByEmail("citizen@civicconnect.gov")) {
                userRepo.save(new User("Citizen Jane", "citizen@civicconnect.gov", encoder.encode("Citizen@123"), "CITIZEN"));
            }
        };
    }
}
