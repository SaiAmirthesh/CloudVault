package com.CloudVault.Backend.file.dto;

public record UploadPartResponse(
        int partNumber,
        long size,
        String etag
) {
}
