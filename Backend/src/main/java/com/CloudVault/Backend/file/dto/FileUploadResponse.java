package com.CloudVault.Backend.file.dto;

import java.util.UUID;

public record FileUploadResponse(
        UUID fileId,
        String filename
) {
}