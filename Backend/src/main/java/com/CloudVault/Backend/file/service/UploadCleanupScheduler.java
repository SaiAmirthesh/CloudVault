package com.CloudVault.Backend.file.service;

import com.CloudVault.Backend.file.entity.UploadSession;
import com.CloudVault.Backend.file.entity.UploadStatus;
import com.CloudVault.Backend.file.repository.UploadPartRepository;
import com.CloudVault.Backend.file.repository.UploadSessionRepository;
import com.CloudVault.Backend.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class UploadCleanupScheduler {

    private final UploadSessionRepository uploadSessionRepository;
    private final UploadPartRepository uploadPartRepository;
    private final StorageService storageService;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupAbandonedUploads() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<UploadSession> abandonedSessions = uploadSessionRepository
                .findByStatusAndCreatedAtBefore(UploadStatus.UPLOADING, threshold);

        if (abandonedSessions.isEmpty()) {
            return;
        }

        log.info("Found {} abandoned upload sessions to clean up", abandonedSessions.size());

        for (UploadSession session : abandonedSessions) {
            try {
                storageService.abortMultipartUpload(
                        session.getObjectKey(),
                        session.getMinioUploadId()
                );
            } catch (Exception e) {
                log.warn("Failed to abort MinIO upload for session {}: {}", session.getId(), e.getMessage());
            }

            try {
                uploadPartRepository.deleteByUploadSession(session);
                uploadSessionRepository.delete(session);
                log.info("Cleaned up abandoned upload session {}", session.getId());
            } catch (Exception e) {
                log.error("Failed to delete DB records for abandoned session {}: {}", session.getId(), e.getMessage());
            }
        }
    }
}
