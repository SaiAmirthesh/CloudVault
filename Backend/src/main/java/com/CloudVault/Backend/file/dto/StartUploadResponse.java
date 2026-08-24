package com.CloudVault.Backend.file.dto;

import com.CloudVault.Backend.file.entity.UploadStatus;

import java.util.UUID;

public record StartUploadResponse(
        UUID uploadId,
        long chunkSize,
        int TotalParts,
        UploadStatus status
) {

}
