package com.CloudVault.Backend.kafka.publisher;

import com.CloudVault.Backend.kafka.entity.OutboxEvent;
import com.CloudVault.Backend.kafka.entity.OutboxStatus;
import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import com.CloudVault.Backend.kafka.producer.FileEventProducer;
import com.CloudVault.Backend.kafka.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxPublisherTest {

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private FileEventProducer fileEventProducer;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OutboxPublisher outboxPublisher;

    private OutboxEvent pendingOutboxEvent;
    private FileUploadedEvent fileUploadedEvent;

    @BeforeEach
    void setUp() throws Exception {
        UUID eventId = UUID.randomUUID();
        fileUploadedEvent = new FileUploadedEvent(
                eventId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "test.pdf",
                "application/pdf",
                2048L,
                "uploads/test.pdf"
        );

        String payload = objectMapper.writeValueAsString(fileUploadedEvent);

        pendingOutboxEvent = OutboxEvent.builder()
                .id(UUID.randomUUID())
                .aggregateType("FILE")
                .aggregateId(fileUploadedEvent.fileId().toString())
                .eventType("FILE_UPLOADED")
                .payload(payload)
                .status(OutboxStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .retryCount(0)
                .build();
    }

    @Test
    void publishPendingEvents_SuccessfulPublish_ShouldUpdateStatusToSent() {
        when(outboxEventRepository.findByStatusOrderByCreatedAtAsc(eq(OutboxStatus.PENDING), any(Pageable.class)))
                .thenReturn(List.of(pendingOutboxEvent));

        outboxPublisher.publishPendingEvents();

        verify(fileEventProducer, times(1)).publishFileUploaded(any(FileUploadedEvent.class));
        verify(outboxEventRepository, times(1)).save(pendingOutboxEvent);
        assertEquals(OutboxStatus.SENT, pendingOutboxEvent.getStatus());
    }

    @Test
    void publishPendingEvents_WhenNoPendingEvents_ShouldDoNothing() {
        when(outboxEventRepository.findByStatusOrderByCreatedAtAsc(eq(OutboxStatus.PENDING), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        outboxPublisher.publishPendingEvents();

        verify(fileEventProducer, never()).publishFileUploaded(any());
        verify(outboxEventRepository, never()).save(any());
    }

    @Test
    void publishPendingEvents_ProducerFails_ShouldIncrementRetryCount() {
        when(outboxEventRepository.findByStatusOrderByCreatedAtAsc(eq(OutboxStatus.PENDING), any(Pageable.class)))
                .thenReturn(List.of(pendingOutboxEvent));
        doThrow(new RuntimeException("Kafka Broker Down"))
                .when(fileEventProducer).publishFileUploaded(any());

        outboxPublisher.publishPendingEvents();

        verify(outboxEventRepository, times(1)).save(pendingOutboxEvent);
        assertEquals(1, pendingOutboxEvent.getRetryCount());
        assertEquals(OutboxStatus.PENDING, pendingOutboxEvent.getStatus());
    }
}

