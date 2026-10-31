package com.civicconnect;

import com.civicconnect.controller.AuthController;
import com.civicconnect.controller.ComplaintController;
import com.civicconnect.controller.OfficerController;
import com.civicconnect.controller.AdminController;
import com.civicconnect.model.Complaint;
import com.civicconnect.model.User;
import com.civicconnect.repository.ComplaintRepository;
import com.civicconnect.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:rbactest;DB_CLOSE_DELAY=-1;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class CivicConnectApplicationTests {

    @Autowired private AuthController authController;
    @Autowired private ComplaintController complaintController;
    @Autowired private OfficerController officerController;
    @Autowired private AdminController adminController;
    @Autowired private UserRepository userRepo;
    @Autowired private ComplaintRepository complaintRepo;

    private Authentication citizenAuth;
    private Authentication officerAuth;
    private Authentication adminAuth;

    @BeforeEach
    void setupAuth() {
        citizenAuth = new UsernamePasswordAuthenticationToken(
                "citizen@civicconnect.gov", null, List.of(new SimpleGrantedAuthority("ROLE_CITIZEN")));
        officerAuth = new UsernamePasswordAuthenticationToken(
                "officer@civicconnect.gov", null, List.of(new SimpleGrantedAuthority("ROLE_OFFICER")));
        adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@civicconnect.gov", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testPublicRegistration_RejectsAdminOrOfficer() {
        ResponseEntity<?> adminAttempt = authController.register(Map.of(
                "name", "Attacker", "email", "attacker@test.com", "password", "pass123", "role", "ADMIN"));
        assertThat(adminAttempt.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<?> citizenReg = authController.register(Map.of(
                "name", "New Citizen", "email", "newcitizen@test.com", "password", "pass123"));
        assertThat(citizenReg.getStatusCode()).isEqualTo(HttpStatus.OK);
        User saved = userRepo.findByEmail("newcitizen@test.com").orElseThrow();
        assertThat(saved.getRole()).isEqualTo("CITIZEN");
        assertThat(saved.isActive()).isTrue();
    }

    @Test
    void testDeactivatedAccount_AuthenticationRejected() {
        User u = userRepo.findByEmail("citizen@civicconnect.gov").orElseThrow();
        u.setActive(false);
        userRepo.save(u);

        ResponseEntity<?> loginResp = authController.login(Map.of(
                "email", "citizen@civicconnect.gov", "password", "Citizen@123"));
        assertThat(loginResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        u.setActive(true);
        userRepo.save(u);
    }

    @Test
    void testCitizen_CanSubmitAndOnlyViewOwnComplaints() {
        SecurityContextHolder.getContext().setAuthentication(citizenAuth);

        ResponseEntity<?> createResp = complaintController.create(citizenAuth, Map.of(
                "title", "Pothole on Main Road", "description", "Dangerous pothole near bus stop"));
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Complaint created = (Complaint) createResp.getBody();
        assertThat(created.getCitizenEmail()).isEqualTo("citizen@civicconnect.gov");
        assertThat(created.getCategory()).isEqualTo("ROADS");

        ResponseEntity<?> myComplaints = complaintController.myComplaints(citizenAuth);
        assertThat(myComplaints.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> list = (List<?>) myComplaints.getBody();
        assertThat(list).isNotEmpty();

        Complaint otherComplaint = complaintRepo.save(new Complaint(
                "Secret issue", "private details", "OTHER", "LOW", "another@test.com"));
        ResponseEntity<?> accessResp = complaintController.getComplaint(citizenAuth, otherComplaint.getId());
        assertThat(accessResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void testOfficer_CanOnlyModifyAssignedComplaints() {
        User officer = userRepo.findByEmail("officer@civicconnect.gov").orElseThrow();

        Complaint unassigned = complaintRepo.save(new Complaint("Street light", "Dark street", "ELECTRICITY", "MEDIUM", "citizen@civicconnect.gov"));

        // Officer tries to update unassigned complaint -> FORBIDDEN
        SecurityContextHolder.getContext().setAuthentication(officerAuth);
        ResponseEntity<?> forbiddenResp = officerController.updateAssignedComplaintStatus(
                officerAuth, unassigned.getId(), Map.of("status", "IN_PROGRESS", "resolutionNotes", "Trying to fix"));
        assertThat(forbiddenResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // Admin assigns to officer
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        ResponseEntity<?> assignResp = adminController.assignComplaint(
                adminAuth, unassigned.getId(), Map.of("officerId", officer.getId()));
        assertThat(assignResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Now officer can update status and resolution notes
        SecurityContextHolder.getContext().setAuthentication(officerAuth);
        ResponseEntity<?> officerUpdate = officerController.updateAssignedComplaintStatus(
                officerAuth, unassigned.getId(), Map.of("status", "RESOLVED", "resolutionNotes", "Bulb replaced successfully"));
        assertThat(officerUpdate.getStatusCode()).isEqualTo(HttpStatus.OK);
        Complaint updated = (Complaint) officerUpdate.getBody();
        assertThat(updated.getStatus()).isEqualTo("RESOLVED");
        assertThat(updated.getResolutionNotes()).isEqualTo("Bulb replaced successfully");
    }

    @Test
    void testAdmin_FullManagementAndAuditLogs() {
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        ResponseEntity<?> stats = adminController.getStats();
        assertThat(stats.getStatusCode()).isEqualTo(HttpStatus.OK);

        User citizen = userRepo.findByEmail("citizen@civicconnect.gov").orElseThrow();
        ResponseEntity<?> statusResp = adminController.updateUserStatus(
                adminAuth, citizen.getId(), Map.of("active", false));
        assertThat(statusResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(userRepo.findById(citizen.getId()).orElseThrow().isActive()).isFalse();

        ResponseEntity<?> auditLogs = adminController.getAuditLogs();
        assertThat(auditLogs.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> logs = (List<?>) auditLogs.getBody();
        assertThat(logs).isNotEmpty();

        adminController.updateUserStatus(adminAuth, citizen.getId(), Map.of("active", true));
    }
}
