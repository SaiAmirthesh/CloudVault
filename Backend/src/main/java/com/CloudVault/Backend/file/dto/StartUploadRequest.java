package com.CloudVault.Backend.file.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StartUploadRequest(
        @NotBlank
        String fileName,

        @NotBlank
        String contentType,

        @NotNull
        @Min(1)
        Long totalSize
) {
}
