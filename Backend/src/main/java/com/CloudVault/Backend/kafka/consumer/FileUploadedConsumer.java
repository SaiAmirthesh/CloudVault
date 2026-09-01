package com.CloudVault.Backend.kafka.consumer;

import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class FileUploadedConsumer {

    @KafkaListener(
            topics = "file.uploaded",
            groupId = "cloudvault-file-processor"
    )
    public void consume(FileUploadedEvent event) {

        log.info(
                "Received file uploaded event: fileId={}, fileName={}, size={}",
                event.fileId(),
                event.fileName(),
                event.size()
        );
    }
}