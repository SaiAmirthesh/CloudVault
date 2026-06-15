package com.CloudVault.Backend.auth.controller;

import com.CloudVault.Backend.auth.dto.AuthResponse;
import com.CloudVault.Backend.auth.dto.LoginRequest;
import com.CloudVault.Backend.auth.dto.RegisterRequest;
import com.CloudVault.Backend.auth.dto.UserInfoResponse;
import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.auth.repository.UserRepository;
import com.CloudVault.Backend.auth.security.CookieUtil;
import com.CloudVault.Backend.auth.service.AuthService;
import com.CloudVault.Backend.auth.service.AuthService.AuthServiceResult;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller.
 *
 * Security design:
 *  - POST /auth/register  → creates user, sets HttpOnly JWT cookie
 *  - POST /auth/login     → validates credentials, sets HttpOnly JWT cookie
 *  - POST /auth/logout    → invalidates server-side token version, clears cookie
 *  - GET  /auth/me        → returns current user info (requires valid JWT cookie)
 *
 * The JWT is NEVER returned in the response body — only set as an HttpOnly, Secure,
 * SameSite=Strict cookie. This means JavaScript cannot read the token,
 * preventing XSS-based token theft.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;
    private final UserRepository userRepository;

    /**
     * Registers a new user account.
     * On success: sets HttpOnly JWT cookie, returns user info (no token in body).
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered");
    }

    /**
     * Authenticates an existing user.
     * On success: sets HttpOnly JWT cookie, returns user info (no token in body).
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthServiceResult result = authService.login(request);
        cookieUtil.addAccessTokenCookie(response, result.token());
        return ResponseEntity.ok(result.response());
    }

    /**
     * Logs out the current user.
     * - Increments tokenVersion server-side → all previously issued JWTs become invalid
     * - Clears the HttpOnly JWT cookie in the browser
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletResponse response
    ) {
        if (userDetails != null) {
            authService.logout(userDetails.getUsername());
        }
        cookieUtil.clearAccessTokenCookie(response);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns the currently authenticated user's profile info.
     * Used by the frontend on page load to verify session and restore user state
     * without relying on localStorage.
     */
    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> me(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(new UserInfoResponse(user.getEmail(), user.getName()));
    }
}
