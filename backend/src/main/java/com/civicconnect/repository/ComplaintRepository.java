package com.civicconnect.repository;

import com.civicconnect.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByCitizenEmailOrderByCreatedAtDesc(String email);
    List<Complaint> findByAssignedOfficerIdOrderByCreatedAtDesc(Long officerId);
    List<Complaint> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
