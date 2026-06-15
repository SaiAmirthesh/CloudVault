package com.CloudVault.Backend.auth.dto;

/**
 * Response returned after successful login or registration.
 *
 * The JWT access token is NOT included in this response body.
 * It is set server-side as an HttpOnly, Secure, SameSite=Strict cookie
 * named "cv_access_token", making it inaccessible to JavaScript (XSS-safe).
 */
public record AuthResponse(
        String token
) {}
