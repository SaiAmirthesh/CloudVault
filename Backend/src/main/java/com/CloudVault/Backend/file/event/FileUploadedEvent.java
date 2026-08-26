package com.CloudVault.Backend.file.event;

import java.time.Instant;
import java.util.UUID;

public record FileUploadedEvent(
        UUID fileId,
        String fileName,
        String objectKey,
        long size,
        String contentType,
        UUID ownerId,
        Instant uploadedAt
) {}