package com.CloudVault.Backend.kafka.consumer;

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

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class MetadataExtractorConsumer {

    public static final String CONSUMER_GROUP = "cloudvault-metadata-extractor";

    private final ProcessedEventRepository processedEventRepository;
    private final StorageService storageService;

    @KafkaListener(
            topics = "file.uploaded",
            groupId = CONSUMER_GROUP
    )
    @Transactional
    public void consume(FileUploadedEvent event) {

        if (event == null || event.eventId() == null) {
            log.warn("[MetadataWorker] Received null event or eventId, skipping.");
            return;
        }

        String idempotencyKey = CONSUMER_GROUP + ":" + event.eventId();

        // 1. Idempotency Check
        if (processedEventRepository.existsByEventIdAndConsumerGroup(event.eventId(), CONSUMER_GROUP)) {
            log.warn("[MetadataWorker] Duplicate event detected (eventId={}), skipping analysis.", event.eventId());
            return;
        }

        try {
            // 2. Extract Metadata from MinIO file stream
            FileAnalysisMetrics metrics = analyzeFileContent(event);

            // 3. Record Idempotency
            ProcessedEvent processedEvent = ProcessedEvent.builder()
                    .id(idempotencyKey)
                    .eventId(event.eventId())
                    .consumerGroup(CONSUMER_GROUP)
                    .eventType("FILE_UPLOADED")
                    .processedAt(LocalDateTime.now())
                    .build();

            processedEventRepository.saveAndFlush(processedEvent);

            log.info("[MetadataWorker] Successfully extracted metadata for fileId={}: category={}, extension={}, lineCount={}",
                    event.fileId(), metrics.category(), metrics.extension(), metrics.lineCount());

        } catch (DataIntegrityViolationException e) {
            log.warn("[MetadataWorker] Concurrent duplicate delivery detected (eventId={}), skipping.", event.eventId());
        } catch (Exception e) {
            log.error("[MetadataWorker] Failed to extract metadata for fileId={}: {}", event.fileId(), e.getMessage(), e);
        }
    }

    private FileAnalysisMetrics analyzeFileContent(FileUploadedEvent event) {
        String fileName = event.fileName() != null ? event.fileName() : "";
        String extension = "";
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = fileName.substring(dotIndex).toLowerCase();
        }

        String category = determineCategory(event.contentType(), extension);
        long lineCount = 0;

        // If plain text or code file, count lines
        if ("TEXT_DOCUMENT".equals(category) || "CODE".equals(category)) {
            try (InputStream is = storageService.downloadFile(event.objectKey());
                 BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                lineCount = reader.lines().count();
            } catch (Exception e) {
                log.debug("Could not read text lines for file {}", event.fileName());
            }
        }

        return new FileAnalysisMetrics(category, extension, lineCount);
    }

    private String determineCategory(String contentType, String extension) {
        if (contentType != null && contentType.startsWith("image/")) {
            return "IMAGE";
        }
        if (contentType != null && contentType.startsWith("video/")) {
            return "VIDEO";
        }
        if (contentType != null && contentType.startsWith("audio/")) {
            return "AUDIO";
        }
        if (".pdf".equals(extension) || ".doc".equals(extension) || ".docx".equals(extension) || ".txt".equals(extension)) {
            return "TEXT_DOCUMENT";
        }
        if (".java".equals(extension) || ".py".equals(extension) || ".js".equals(extension) || ".html".equals(extension) || ".json".equals(extension)) {
            return "CODE";
        }
        return "GENERAL_FILE";
    }

    private record FileAnalysisMetrics(String category, String extension, long lineCount) {}
}

