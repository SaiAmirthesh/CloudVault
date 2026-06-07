package com.CloudVault.Backend.file.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ShareLinkResponse(
        UUID id,
        String token,
        String sharePath,
        LocalDateTime expiresAt,
        boolean passwordProtected,
        LocalDateTime createdAt
) {}
