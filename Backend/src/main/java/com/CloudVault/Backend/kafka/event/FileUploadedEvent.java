package com.CloudVault.Backend.kafka.event;

import java.util.UUID;

public record FileUploadedEvent(
        UUID eventId,
        UUID fileId,
        UUID ownerId,
        String fileName,
        String contentType,
        long size,
        String objectKey
) {
}