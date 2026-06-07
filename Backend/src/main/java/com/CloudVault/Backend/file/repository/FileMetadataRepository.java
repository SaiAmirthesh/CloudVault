package com.CloudVault.Backend.file.repository;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.file.entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface FileMetadataRepository extends JpaRepository<FileMetadata, UUID> {
    Page<FileMetadata> findByOwner(User owner, Pageable pageable);
    Optional<FileMetadata> findByIdAndOwner(UUID id, User owner);
}
