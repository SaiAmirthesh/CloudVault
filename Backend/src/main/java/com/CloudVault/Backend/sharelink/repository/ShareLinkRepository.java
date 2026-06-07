package com.CloudVault.Backend.sharelink.repository;

import com.CloudVault.Backend.file.entity.FileMetadata;
import com.CloudVault.Backend.sharelink.entity.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ShareLinkRepository extends JpaRepository<ShareLink, UUID> {
    Optional<ShareLink> findByToken(String token);
    boolean existsByToken(String token);
    void deleteByFile(FileMetadata file);
}
