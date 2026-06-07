package com.CloudVault.Backend.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        String email,
        String name
) {}
