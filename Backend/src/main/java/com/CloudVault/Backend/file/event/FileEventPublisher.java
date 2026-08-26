package com.CloudVault.Backend.file.event;

import com.CloudVault.Backend.file.entity.FileMetadata;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class FileEventPublisher {

    private static final String TOPIC_FILE_UPLOADED = "cloudvault.file.uploaded";
    private final KafkaTemplate<String, FileUploadedEvent> kafkaTemplate;

    public void publishFileUploaded(FileMetadata file) {
        FileUploadedEvent event = new FileUploadedEvent(
                file.getId(),
                file.getOriginalFileName(),
                file.getObjectKey(),
                file.getSize(),
                file.getContentType(),
                file.getOwner().getId(),
                Instant.now()
        );

        kafkaTemplate.send(TOPIC_FILE_UPLOADED, file.getId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Published FileUploadedEvent for fileId: {}", file.getId());
                    } else {
                        log.error("Failed to publish FileUploadedEvent for fileId: {}", file.getId(), ex);
                    }
                });
    }
}