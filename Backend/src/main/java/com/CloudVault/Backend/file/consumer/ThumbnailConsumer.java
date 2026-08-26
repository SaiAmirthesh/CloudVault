package com.CloudVault.Backend.file.consumer;

import com.CloudVault.Backend.file.event.FileUploadedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ThumbnailConsumer {

    @KafkaListener(topics = "cloudvault.file.uploaded", groupId = "thumbnail-group")
    public void generateThumbnail(FileUploadedEvent event) {
        if (event.contentType() != null && event.contentType().startsWith("image/")) {
            log.info("🖼️ [Kafka Consumer: Thumbnail] Generating image preview thumbnail for fileId={}, fileName={}",
                    event.fileId(), event.fileName());
            log.info("✅ [Kafka Consumer: Thumbnail] Thumbnail processing finished for fileId={}", event.fileId());
        } else {
            log.info("ℹ️ [Kafka Consumer: Thumbnail] Skipping non-image file fileId={}", event.fileId());
        }
    }
}
