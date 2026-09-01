package com.CloudVault.Backend.kafka.consumer;

import com.CloudVault.Backend.kafka.entity.ProcessedEvent;
import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import com.CloudVault.Backend.kafka.repository.ProcessedEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileUploadedConsumerTest {

    @Mock
    private ProcessedEventRepository processedEventRepository;

    @InjectMocks
    private FileUploadedConsumer fileUploadedConsumer;

    private FileUploadedEvent event;
    private UUID eventId;

    @BeforeEach
    void setUp() {
        eventId = UUID.randomUUID();
        event = new FileUploadedEvent(
                eventId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "test.pdf",
                "application/pdf",
                1024L,
                "uploads/test.pdf"
        );
    }

    @Test
    void consume_FirstTimeEvent_ShouldProcessAndSaveProcessedEvent() {
        when(processedEventRepository.existsByEventIdAndConsumerGroup(eventId, "cloudvault-file-processor")).thenReturn(false);

        fileUploadedConsumer.consume(event);

        verify(processedEventRepository, times(1)).existsByEventIdAndConsumerGroup(eventId, "cloudvault-file-processor");
        verify(processedEventRepository, times(1)).saveAndFlush(any(ProcessedEvent.class));
    }

    @Test
    void consume_DuplicateEvent_ShouldSkipProcessing() {
        when(processedEventRepository.existsByEventIdAndConsumerGroup(eventId, "cloudvault-file-processor")).thenReturn(true);

        fileUploadedConsumer.consume(event);

        verify(processedEventRepository, times(1)).existsByEventIdAndConsumerGroup(eventId, "cloudvault-file-processor");
        verify(processedEventRepository, never()).saveAndFlush(any(ProcessedEvent.class));
    }
}
