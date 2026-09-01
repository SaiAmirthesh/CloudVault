package com.CloudVault.Backend.kafka.consumer;

import com.CloudVault.Backend.file.entity.FileMetadata;
import com.CloudVault.Backend.file.entity.SecurityScanStatus;
import com.CloudVault.Backend.file.repository.FileMetadataRepository;
import com.CloudVault.Backend.kafka.entity.ProcessedEvent;
import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import com.CloudVault.Backend.kafka.repository.ProcessedEventRepository;
import com.CloudVault.Backend.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class SecurityCheckerConsumer {

    public static final String CONSUMER_GROUP = "cloudvault-security-checker";
    private static final Set<String> FORBIDDEN_EXTENSIONS = Set.of(".exe", ".bat", ".sh", ".cmd", ".dll", ".vbs", ".scr");

    private final ProcessedEventRepository processedEventRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final StorageService storageService;

    @KafkaListener(
            topics = "file.uploaded",
            groupId = CONSUMER_GROUP
    )
    @Transactional
    public void consume(FileUploadedEvent event) {

        if (event == null || event.eventId() == null) {
            log.warn("[SecurityWorker] Received null event or eventId, skipping.");
            return;
        }

        String idempotencyKey = CONSUMER_GROUP + ":" + event.eventId();

        // 1. Idempotency Check
        if (processedEventRepository.existsByEventIdAndConsumerGroup(event.eventId(), CONSUMER_GROUP)) {
            log.warn("[SecurityWorker] Duplicate event detected (eventId={}), skipping re-scan.", event.eventId());
            return;
        }

        try {
            // 2. Fetch FileMetadata
            FileMetadata metadata = fileMetadataRepository.findById(event.fileId())
                    .orElse(null);

            if (metadata == null) {
                log.error("[SecurityWorker] FileMetadata not found for fileId={}", event.fileId());
                return;
            }

            // 3. Perform Security Inspection from MinIO Stream
            boolean isSafe = performSecurityScan(event);

            SecurityScanStatus scanResult = isSafe ? SecurityScanStatus.PASSED : SecurityScanStatus.QUARANTINED;
            metadata.setSecurityScanStatus(scanResult);
            metadata.setProcessedAt(LocalDateTime.now());
            fileMetadataRepository.save(metadata);

            // 4. Record Idempotency
            ProcessedEvent processedEvent = ProcessedEvent.builder()
                    .id(idempotencyKey)
                    .eventId(event.eventId())
                    .consumerGroup(CONSUMER_GROUP)
                    .eventType("FILE_UPLOADED")
                    .processedAt(LocalDateTime.now())
                    .build();

            processedEventRepository.saveAndFlush(processedEvent);

            if (isSafe) {
                log.info("[SecurityWorker] File PASSED security scan: fileId={}, fileName={}",
                        event.fileId(), event.fileName());
            } else {
                log.warn("[SecurityWorker] ALERT: File QUARANTINED due to potential malicious content: fileId={}, fileName={}",
                        event.fileId(), event.fileName());
            }

        } catch (DataIntegrityViolationException e) {
            log.warn("[SecurityWorker] Concurrent duplicate delivery detected (eventId={}), skipping.", event.eventId());
        } catch (Exception e) {
            log.error("[SecurityWorker] Error scanning file fileId={}: {}", event.fileId(), e.getMessage(), e);

            fileMetadataRepository.findById(event.fileId()).ifPresent(meta -> {
                meta.setSecurityScanStatus(SecurityScanStatus.FAILED);
                fileMetadataRepository.save(meta);
            });
        }
    }

    private boolean performSecurityScan(FileUploadedEvent event) {
        String fileName = event.fileName() != null ? event.fileName().toLowerCase() : "";

        // Check dangerous extensions
        for (String forbidden : FORBIDDEN_EXTENSIONS) {
            if (fileName.endsWith(forbidden)) {
                return false;
            }
        }

        // Inspect initial byte header (Magic Bytes) from MinIO
        try (InputStream is = storageService.downloadFile(event.objectKey())) {
            byte[] header = new byte[8];
            int read = is.read(header);
            if (read > 0) {
                // Check Windows Executable Signature (MZ header: 0x4D, 0x5A)
                if (read >= 2 && header[0] == 0x4D && header[1] == 0x5A) {
                    return false;
                }
                // Check ELF Executable Signature (0x7F, 'E', 'L', 'F')
                if (read >= 4 && header[0] == 0x7F && header[1] == 'E' && header[2] == 'L' && header[3] == 'F') {
                    return false;
                }
            }
        } catch (Exception e) {
            log.error("Failed to read file header from MinIO for security scan", e);
        }

        return true;
    }
}

