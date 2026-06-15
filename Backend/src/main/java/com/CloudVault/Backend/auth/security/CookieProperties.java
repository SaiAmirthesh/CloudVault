package com.CloudVault.Backend.auth.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the JWT HttpOnly cookie.
 *
 * Properties (prefix: app.cookie):
 *   app.cookie.secure   = true in production (HTTPS), false in local dev (HTTP)
 *   app.cookie.same-site = Strict (default) — blocks cross-site cookie sending
 *   app.cookie.max-age-seconds = cookie lifetime in seconds (default: 3600 = 1 hour)
 */
@ConfigurationProperties(prefix = "app.cookie")
public record CookieProperties(
        boolean secure,
        String sameSite,
        int maxAgeSeconds
) {
    public CookieProperties {
        if (sameSite == null || sameSite.isBlank()) {
            sameSite = "Strict";
        }
        if (maxAgeSeconds <= 0) {
            maxAgeSeconds = 3600;
        }
    }
}
