package com.CloudVault.Backend.file.dto;

import org.springframework.core.io.InputStreamResource;

import java.util.UUID;

public record FileDownloadResponse(
        UUID id,
        String filename,
        String contentType,
        Long size,
        InputStreamResource resource
) {}
