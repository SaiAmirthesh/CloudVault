package com.CloudVault.Backend.auth.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException, ServletException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(buildJson(HttpStatus.FORBIDDEN, "Access denied", request.getRequestURI()));
    }

    private String buildJson(HttpStatus status, String message, String path) {
        return "{"
                + "\"timestamp\":\"" + Instant.now() + "\","
                + "\"status\":" + status.value() + ","
                + "\"error\":\"" + escape(status.getReasonPhrase()) + "\","
                + "\"message\":\"" + escape(message) + "\","
                + "\"path\":\"" + escape(path) + "\""
                + "}";
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
