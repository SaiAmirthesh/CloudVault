package com.CloudVault.Backend.kafka.publisher;

import com.CloudVault.Backend.kafka.entity.OutboxEvent;
import com.CloudVault.Backend.kafka.entity.OutboxStatus;
import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import com.CloudVault.Backend.kafka.producer.FileEventProducer;
import com.CloudVault.Backend.kafka.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled worker that polls pending outbox events from PostgreSQL,
 * publishes them to Kafka, and updates their status to SENT or FAILED.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class OutboxPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final FileEventProducer fileEventProducer;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelayString = "${cloudvault.outbox.publisher.fixed-delay-ms:3000}")
    public void publishPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository
                .findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING, PageRequest.of(0, 50));

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Found {} pending outbox events to publish to Kafka.", pendingEvents.size());

        for (OutboxEvent outboxEvent : pendingEvents) {
            publishSingleEvent(outboxEvent);
        }
    }

    private void publishSingleEvent(OutboxEvent outboxEvent) {
        try {
            if ("FILE_UPLOADED".equals(outboxEvent.getEventType())) {
                FileUploadedEvent event = objectMapper.readValue(
                        outboxEvent.getPayload(),
                        FileUploadedEvent.class
                );

                fileEventProducer.publishFileUploaded(event);

                outboxEvent.setStatus(OutboxStatus.SENT);
                outboxEvent.setProcessedAt(LocalDateTime.now());
                outboxEventRepository.save(outboxEvent);

                log.info("Successfully published outbox event to Kafka: outboxId={}, eventId={}",
                        outboxEvent.getId(), event.eventId());
            }
        } catch (Exception e) {
            log.error("Failed to publish outbox event: outboxId={}. Error: {}", outboxEvent.getId(), e.getMessage(), e);

            int newRetryCount = outboxEvent.getRetryCount() + 1;
            outboxEvent.setRetryCount(newRetryCount);
            outboxEvent.setErrorMessage(e.getMessage());

            if (newRetryCount >= 5) {
                outboxEvent.setStatus(OutboxStatus.FAILED);
            }
            outboxEventRepository.save(outboxEvent);
        }
    }
}

