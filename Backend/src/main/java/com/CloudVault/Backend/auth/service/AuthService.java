package com.CloudVault.Backend.auth.service;

import com.CloudVault.Backend.auth.dto.AuthResponse;
import com.CloudVault.Backend.auth.dto.LoginRequest;
import com.CloudVault.Backend.auth.dto.RegisterRequest;
import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.auth.repository.UserRepository;
import com.CloudVault.Backend.exception.InvalidCredentialsException;
import com.CloudVault.Backend.exception.UserAlreadyExistsException;
import com.CloudVault.Backend.auth.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Registers a new user. Returns the generated JWT token and user info.
     * The token is NOT included in AuthResponse — the caller (controller) sets it as a cookie.
     */
    @Transactional
    public AuthServiceResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        String accessToken = jwtService.generateAccessToken(savedUser);

        return new AuthServiceResult(accessToken, new AuthResponse(accessToken));
    }

    /**
     * Authenticates a user. Returns the generated JWT token and user info.
     * The token is NOT included in AuthResponse — the caller (controller) sets it as a cookie.
     */
    public AuthServiceResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user);

        return new AuthServiceResult(accessToken, new AuthResponse(accessToken));
    }

    /**
     * Invalidates all existing JWT tokens for the user by incrementing tokenVersion.
     * Any previously issued token will fail validation since its embedded tokenVersion
     * will no longer match the user's current tokenVersion.
     */
    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setTokenVersion(user.getTokenVersion() + 1);
            userRepository.save(user);
        });
    }

    /**
     * Internal result record to carry both the raw JWT string and the safe response DTO.
     * The raw token is handed to the controller which sets it as an HttpOnly cookie.
     */
    public record AuthServiceResult(String token, AuthResponse response) {}
}
