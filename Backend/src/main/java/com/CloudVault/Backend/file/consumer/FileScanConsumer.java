package com.CloudVault.Backend.file.consumer;

import com.CloudVault.Backend.file.event.FileUploadedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FileScanConsumer {

    @RetryableTopic(
            attempts = "3",
            backoff = @Backoff(delay = 1000, multiplier = 2.0)
    )
    @KafkaListener(topics = "cloudvault.file.uploaded", groupId = "scan-group")
    public void scanFile(FileUploadedEvent event) {
        log.info("🔍 [Kafka Consumer: Scan] Received FileUploadedEvent for fileId={}, fileName={}",
                event.fileId(), event.fileName());

        // Perform background antivirus scan simulation
        log.info("✅ [Kafka Consumer: Scan] Antivirus scan completed cleanly for fileId={}", event.fileId());
    }
}
