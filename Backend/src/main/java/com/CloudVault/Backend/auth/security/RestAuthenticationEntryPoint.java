package com.CloudVault.Backend.auth.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException, ServletException {
        writeError(response, request, HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    private void writeError(
            HttpServletResponse response,
            HttpServletRequest request,
            HttpStatus status,
            String message
    ) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(buildJson(status, message, request.getRequestURI()));
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
