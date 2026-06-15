package com.CloudVault.Backend.auth.security.jwt;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.auth.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * JWT Authentication Filter.
 *
 * Token extraction priority:
 *   1. HttpOnly cookie named "cv_access_token"  (primary — XSS-safe)
 *   2. Authorization: Bearer <token> header     (fallback — for Swagger / API clients)
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** Name of the HttpOnly cookie that holds the JWT access token. */
    public static final String ACCESS_TOKEN_COOKIE = "cv_access_token";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/auth/login")
                || path.equals("/auth/register")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs/")
                || path.startsWith("/share/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Skip if already authenticated (e.g., already processed this request)
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractToken(request);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (!jwtService.isTokenValid(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            String email = jwtService.extractEmail(token);
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null
                    || !user.isEnabled()
                    || user.getTokenVersion() != jwtService.extractTokenVersion(token)) {
                // Token has been invalidated (e.g., logout incremented tokenVersion)
                filterChain.doFilter(request, response);
                return;
            }

            UserDetails principal = org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                    .build();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JwtException | IllegalArgumentException e) {
            // Invalid token — continue unauthenticated; Spring Security will reject if endpoint is protected
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts the JWT from the request.
     * Priority: HttpOnly cookie → Authorization header (Bearer).
     */
    private String extractToken(HttpServletRequest request) {
        // 1. Try HttpOnly cookie first (secure path — XSS-resistant)
        if (request.getCookies() != null) {
            String cookieToken = Arrays.stream(request.getCookies())
                    .filter(cookie -> ACCESS_TOKEN_COOKIE.equals(cookie.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
            if (cookieToken != null && !cookieToken.isBlank()) {
                return cookieToken;
            }
        }

        // 2. Fallback: Authorization: Bearer header (for Swagger UI / REST clients)
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }

        return null;
    }
}
