package com.CloudVault.Backend.kafka.consumer;

import com.CloudVault.Backend.kafka.entity.ProcessedEvent;
import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import com.CloudVault.Backend.kafka.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Consumer for file upload events with Idempotent Processing.
 * <p>
 * <b>Offset vs Database Transaction Explanation:</b>
 * <br>
 * Kafka and relational databases (PostgreSQL) use distinct transaction contexts.
 * In Kafka's default "At-Least-Once" delivery mode:
 * <ul>
 *   <li>The consumer processes the message and performs DB operations.</li>
 *   <li>The consumer then commits the Kafka offset back to the cluster.</li>
 * </ul>
 * If the application crashes, restarts, or loses network connectivity between the DB commit
 * and the Kafka offset commit, Kafka will redeliver the exact same event upon consumer restart.
 * <p>
 * Because Kafka offsets and relational DB transactions cannot be combined into a single 2-Phase Commit (2PC)
 * without major performance penalties, we achieve <b>Idempotency</b> by maintaining a 
 * {@code processed_events} table in PostgreSQL using {@code eventId} as the primary key.
 * <p>
 * When a redelivered message arrives:
 * <ol>
 *   <li>We check if {@code eventId} already exists in {@code processed_events}.</li>
 *   <li>If present, the consumer logs the duplicate event and skips processing.</li>
 *   <li>If absent, the consumer executes processing and saves the {@code eventId} to {@code processed_events} atomically.</li>
 * </ol>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FileUploadedConsumer {

    private final ProcessedEventRepository processedEventRepository;

    @KafkaListener(
            topics = "file.uploaded",
            groupId = "cloudvault-file-processor"
    )
    @Transactional
    public void consume(FileUploadedEvent event) {

        if (event == null || event.eventId() == null) {
            log.warn("Received invalid or null event, skipping processing.");
            return;
        }

        String consumerGroup = "cloudvault-file-processor";
        String idempotencyKey = consumerGroup + ":" + event.eventId();

        // 1. Idempotency Check: Drop duplicate event if already processed
        if (processedEventRepository.existsByEventIdAndConsumerGroup(event.eventId(), consumerGroup)) {
            log.warn("Duplicate event detected (eventId={}), skipping re-processing.", event.eventId());
            return;
        }

        try {
            // 2. Mark event as processed in the database
            ProcessedEvent processedEvent = ProcessedEvent.builder()
                    .id(idempotencyKey)
                    .eventId(event.eventId())
                    .consumerGroup(consumerGroup)
                    .eventType("FILE_UPLOADED")
                    .processedAt(LocalDateTime.now())
                    .build();

            processedEventRepository.saveAndFlush(processedEvent);

            // 3. Business processing logic
            log.info(
                    "Successfully processed file uploaded event: eventId={}, fileId={}, fileName={}, size={}",
                    event.eventId(),
                    event.fileId(),
                    event.fileName(),
                    event.size()
            );

        } catch (DataIntegrityViolationException e) {
            // Handles concurrent duplicate delivery edge cases gracefully
            log.warn("Concurrent duplicate event detected (eventId={}), skipping re-processing.", event.eventId());
        }
    }
}