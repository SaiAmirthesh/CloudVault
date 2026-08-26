package com.CloudVault.Backend.file.dto;

import com.CloudVault.Backend.file.entity.UploadStatus;

import java.util.List;
import java.util.UUID;

public record UploadStatusResponse(
        UUID uploadId,
        String fileName,
        long totalSize,
        int totalParts,
        UploadStatus status,
        List<Integer> uploadedParts,
        List<Integer> missingParts
) {
}
