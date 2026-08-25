package com.CloudVault.Backend.file.repository;

import com.CloudVault.Backend.file.entity.UploadPart;
import com.CloudVault.Backend.file.entity.UploadSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UploadPartRepository extends JpaRepository<UploadPart, UUID> {
    Optional<UploadPart> findByUploadSessionAndPartNumber(
            UploadSession uploadSession,
            int partNumber
    );

    List<UploadPart> findByUploadSessionOrderByPartNumberAsc(
            UploadSession uploadSession
    );

    boolean existsByUploadSessionAndPartNumber(
            UploadSession uploadSession,
            int partNumber
    );

}
