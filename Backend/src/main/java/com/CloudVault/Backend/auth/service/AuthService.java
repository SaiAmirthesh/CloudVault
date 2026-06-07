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

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final String TOKEN_TYPE = "Bearer";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        String accessToken = jwtService.generateAccessToken(savedUser);

        return new AuthResponse(accessToken, TOKEN_TYPE, savedUser.getEmail(), savedUser.getName());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user);

        return new AuthResponse(accessToken, TOKEN_TYPE, user.getEmail(), user.getName());
    }
}
