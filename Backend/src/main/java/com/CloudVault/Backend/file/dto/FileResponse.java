package com.CloudVault.Backend.file.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record FileResponse(
        UUID id,
        String filename,
        Long size,
        String contentType,
        LocalDateTime uploadedAt
) {
}