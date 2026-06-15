package com.CloudVault.Backend.auth.dto;

/**
 * Response for GET /auth/me — returns current authenticated user's profile.
 * Used by the frontend to initialize user state without localStorage.
 */
public record UserInfoResponse(
        String email,
        String name
) {}
