package com.CloudVault.Backend.file.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CreateShareLinkRequest(
        LocalDateTime expiresAt,
        @Size(max = 128) String password
) {}
