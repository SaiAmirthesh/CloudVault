package com.CloudVault.Backend.file.repository;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.file.entity.UploadSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UploadSessionRepository extends JpaRepository<UploadSession, UUID> {
    Optional<UploadSession> findByIdAndUser(UUID id, User user);
}
