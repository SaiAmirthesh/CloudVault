package com.CloudVault.Backend.auth.security;

import com.CloudVault.Backend.auth.security.jwt.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Utility for creating and clearing the JWT HttpOnly cookie.
 *
 * Security properties set on the cookie:
 *   - HttpOnly  : JavaScript cannot access it → XSS-proof
 *   - Secure    : Only sent over HTTPS (configurable; false in local dev)
 *   - SameSite  : Strict/Lax — never sent in cross-site requests → CSRF-proof
 *   - Path      : "/" — valid for all endpoints
 *   - MaxAge    : Matches the JWT expiry (default 1 hour)
 */
@Component
public class CookieUtil {

    private final CookieProperties cookieProperties;

    public CookieUtil(CookieProperties cookieProperties) {
        this.cookieProperties = cookieProperties;
    }

    /**
     * Adds the JWT access token as an HttpOnly cookie to the response.
     *
     * @param response the HTTP response to add the cookie to
     * @param token    the raw JWT string
     */
    public void addAccessTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .path("/")
                .maxAge(cookieProperties.maxAgeSeconds())
                .sameSite(cookieProperties.sameSite())
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Clears the JWT access token cookie (sets MaxAge=0, empty value).
     *
     * @param response the HTTP response to clear the cookie in
     */
    public void clearAccessTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .path("/")
                .maxAge(0)
                .sameSite(cookieProperties.sameSite())
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
