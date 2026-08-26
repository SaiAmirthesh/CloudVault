package com.CloudVault.Backend.file.repository;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.file.entity.UploadSession;
import com.CloudVault.Backend.file.entity.UploadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UploadSessionRepository extends JpaRepository<UploadSession, UUID> {
    Optional<UploadSession> findByIdAndUser(UUID id, User user);

    List<UploadSession> findByStatusAndCreatedAtBefore(UploadStatus status, LocalDateTime threshold);
}
