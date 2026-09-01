package com.CloudVault.Backend.kafka.producer;

import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FileEventProducer {

    private static final String FILE_UPLOADED_TOPIC = "file.uploaded";

    private final KafkaTemplate<String, FileUploadedEvent> kafkaTemplate;

    public void publishFileUploaded(FileUploadedEvent event) {

        kafkaTemplate.send(
                FILE_UPLOADED_TOPIC,
                event.fileId().toString(),
                event
        );
    }
}