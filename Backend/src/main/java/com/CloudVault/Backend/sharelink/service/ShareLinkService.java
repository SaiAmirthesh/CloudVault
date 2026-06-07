package com.CloudVault.Backend.sharelink.service;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.auth.security.AuthenticatedUserService;
import com.CloudVault.Backend.exception.ForbiddenOperationException;
import com.CloudVault.Backend.exception.ResourceNotFoundException;
import com.CloudVault.Backend.file.dto.CreateShareLinkRequest;
import com.CloudVault.Backend.file.dto.FileDownloadResponse;
import com.CloudVault.Backend.file.dto.ShareLinkResponse;
import com.CloudVault.Backend.file.entity.FileMetadata;
import com.CloudVault.Backend.file.repository.FileMetadataRepository;
import com.CloudVault.Backend.storage.service.StorageService;
import com.CloudVault.Backend.sharelink.entity.ShareLink;
import com.CloudVault.Backend.sharelink.repository.ShareLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareLinkService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ShareLinkRepository shareLinkRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final StorageService storageService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public ShareLinkResponse createShareLink(UUID fileId, CreateShareLinkRequest request) {
        User currentUser = authenticatedUserService.getCurrentUser();
        FileMetadata file = loadOwnedFile(fileId, currentUser);

        if (request.expiresAt() != null && request.expiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Expiration must be in the future");
        }

        String password = normalizePassword(request.password());
        boolean passwordProtected = password != null;

        ShareLink shareLink = ShareLink.builder()
                .token(generateUniqueToken())
                .file(file)
                .owner(currentUser)
                .expiresAt(request.expiresAt())
                .passwordProtected(passwordProtected)
                .passwordHash(passwordProtected ? passwordEncoder.encode(password) : null)
                .build();

        ShareLink saved = shareLinkRepository.saveAndFlush(shareLink);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public FileDownloadResponse downloadSharedFile(String token, String password) {
        ShareLink shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Share link not found"));

        validateShareLink(shareLink, password);

        FileMetadata file = shareLink.getFile();
        return new FileDownloadResponse(
                file.getId(),
                file.getOriginalFileName(),
                file.getContentType(),
                file.getSize(),
                new InputStreamResource(storageService.downloadFile(file.getObjectKey()))
        );
    }

    private void validateShareLink(ShareLink shareLink, String password) {
        if (shareLink.getExpiresAt() != null && shareLink.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResourceNotFoundException("Share link not found");
        }

        if (!shareLink.isPasswordProtected()) {
            return;
        }

        String normalizedPassword = normalizePassword(password);
        if (normalizedPassword == null || !passwordEncoder.matches(normalizedPassword, shareLink.getPasswordHash())) {
            throw new ForbiddenOperationException("Invalid share password");
        }
    }

    private FileMetadata loadOwnedFile(UUID fileId, User currentUser) {
        return fileMetadataRepository.findByIdAndOwner(fileId, currentUser)
                .orElseGet(() -> {
                    fileMetadataRepository.findById(fileId)
                            .orElseThrow(() -> new ResourceNotFoundException("File not found"));
                    throw new ForbiddenOperationException("You do not own this file");
                });
    }

    private String generateUniqueToken() {
        String token;
        do {
            byte[] randomBytes = new byte[32];
            SECURE_RANDOM.nextBytes(randomBytes);
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        } while (shareLinkRepository.existsByToken(token));
        return token;
    }

    private ShareLinkResponse toResponse(ShareLink shareLink) {
        return new ShareLinkResponse(
                shareLink.getId(),
                shareLink.getToken(),
                "/share/" + shareLink.getToken(),
                shareLink.getExpiresAt(),
                shareLink.isPasswordProtected(),
                shareLink.getCreatedAt()
        );
    }

    private String normalizePassword(String password) {
        if (password == null || password.isBlank()) {
            return null;
        }
        return password;
    }
}
