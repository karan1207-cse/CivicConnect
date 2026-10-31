package com.civicconnect;

import com.civicconnect.model.Complaint;
import com.civicconnect.model.User;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootApplication
public class CivicConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicConnectApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedInitialData(UserRepository userRepo, ComplaintRepository complaintRepo, BCryptPasswordEncoder encoder) {
        return args -> {
            if (!userRepo.existsByEmail("admin@civicconnect.gov")) {
                userRepo.save(new User("Municipal Admin", "admin@civicconnect.gov", encoder.encode("Admin@123"), "ADMIN"));
            }
            User officer = userRepo.findByEmail("officer@civicconnect.gov").orElseGet(() ->
                    userRepo.save(new User("Field Officer John", "officer@civicconnect.gov", encoder.encode("Officer@123"), "OFFICER")));
            if (!userRepo.existsByEmail("citizen@civicconnect.gov")) {
                userRepo.save(new User("Citizen Jane", "citizen@civicconnect.gov", encoder.encode("Citizen@123"), "CITIZEN"));
            }

            if (complaintRepo.count() < 5) {
                Long offId = officer.getId();
                List<Complaint> seeds = List.of(
                        createSeed("Deep crater pothole on Main Blvd", "Large pothole causing vehicle damage", "ROADS", "HIGH", "RESOLVED", "citizen@civicconnect.gov", offId, "Asphalt patchwork completed", 13),
                        createSeed("Contaminated brown tap water", "Muddy sediment in water supply", "WATER_SUPPLY", "CRITICAL", "RESOLVED", "citizen@civicconnect.gov", offId, "Supply pipeline flushed", 11),
                        createSeed("Streetlights blacked out on Oakwood", "8 streetlights failed", "ELECTRICITY", "MEDIUM", "RESOLVED", "citizen@civicconnect.gov", offId, "Replaced central fuse", 10),
                        createSeed("Overflowing municipal garbage dumpster", "Sidewalk blocked by trash", "SANITATION", "HIGH", "RESOLVED", "citizen@civicconnect.gov", offId, "Compactor cleared site", 8),
                        createSeed("Heavily rutted road surface", "Sharp gravel exposed after rain", "ROADS", "HIGH", "IN_PROGRESS", "citizen@civicconnect.gov", offId, null, 6),
                        createSeed("Severe low water pressure in colony", "Water not reaching upper floors", "WATER_SUPPLY", "MEDIUM", "IN_PROGRESS", "citizen@civicconnect.gov", offId, null, 5),
                        createSeed("Sparking transformer pole", "Loud buzzing and sparks at night", "ELECTRICITY", "URGENT", "IN_PROGRESS", "citizen@civicconnect.gov", offId, null, 3),
                        createSeed("Sewage backflow in residential drain", "Foul water overflowing on street", "DRAINAGE", "HIGH", "ASSIGNED", "citizen@civicconnect.gov", offId, null, 2),
                        createSeed("Continuous water pipe leak", "Pressurized leak on sidewalk", "WATER_SUPPLY", "HIGH", "ASSIGNED", "citizen@civicconnect.gov", offId, null, 2),
                        createSeed("Dangerous sinkhole forming around utility box", "Asphalt collapsing", "ROADS", "HIGH", "PENDING", "citizen@civicconnect.gov", null, null, 1),
                        createSeed("Garbage truck skipped collection", "Bins uncollected for 3 days", "SANITATION", "MEDIUM", "PENDING", "citizen@civicconnect.gov", null, null, 1),
                        createSeed("Missing safety guardrail along canal", "Damaged barrier leaving drop", "PUBLIC_SAFETY", "HIGH", "PENDING", "citizen@civicconnect.gov", null, null, 0)
                );
                complaintRepo.saveAll(seeds);
            }
        };
    }

    private static Complaint createSeed(String title, String desc, String cat, String prio, String status, String citizen, Long officerId, String notes, int daysAgo) {
        Complaint c = new Complaint(title, desc, cat, prio, citizen);
        c.setStatus(status);
        c.setAssignedOfficerId(officerId);
        c.setResolutionNotes(notes);
        c.setCreatedAt(LocalDateTime.now().minusDays(daysAgo));
        return c;
    }
}
