package com.CloudVault.Backend.file.service;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.auth.security.AuthenticatedUserService;
import com.CloudVault.Backend.file.dto.StartUploadRequest;
import com.CloudVault.Backend.file.dto.StartUploadResponse;
import com.CloudVault.Backend.file.dto.UploadPartResponse;
import com.CloudVault.Backend.file.entity.UploadSession;
import com.CloudVault.Backend.file.entity.UploadStatus;
import com.CloudVault.Backend.file.repository.UploadPartRepository;
import com.CloudVault.Backend.file.repository.UploadSessionRepository;
import com.CloudVault.Backend.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.CloudVault.Backend.exception.ResourceNotFoundException;
import com.CloudVault.Backend.file.entity.UploadPart;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadService {

    private static final long CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

    private final UploadSessionRepository uploadSessionRepository;
    private final StorageService storageService;
    private final AuthenticatedUserService authenticatedUserService;
    private final UploadPartRepository uploadPartRepository;

    @Transactional
    public StartUploadResponse startUpload(StartUploadRequest request) {

        User currentUser = authenticatedUserService.getCurrentUser();

        int totalParts = (int) Math.ceil(
                (double) request.totalSize() / CHUNK_SIZE
        );

        String objectKey = generateObjectKey(
                currentUser.getId(),
                request.fileName()
        );

        String minioUploadId;

        try {
            minioUploadId = storageService.initiateMultipartUpload(
                    objectKey,
                    request.contentType()
            );
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to initialize upload",
                    e
            );
        }

        UploadSession uploadSession = UploadSession.builder()
                .user(currentUser)
                .fileName(request.fileName())
                .contentType(request.contentType())
                .totalSize(request.totalSize())
                .chunkSize(CHUNK_SIZE)
                .totalParts(totalParts)
                .status(UploadStatus.UPLOADING)
                .objectKey(objectKey)
                .minioUploadId(minioUploadId)
                .build();

        UploadSession savedSession =
                uploadSessionRepository.save(uploadSession);

        return new StartUploadResponse(
                savedSession.getId(),
                savedSession.getChunkSize(),
                savedSession.getTotalParts(),
                savedSession.getStatus()
        );
    }

    private String generateObjectKey(
            UUID userId,
            String fileName
    ) {
        return "uploads/"
                + userId
                + "/"
                + UUID.randomUUID()
                + "-"
                + fileName;
    }

    @Transactional
    public UploadPartResponse uploadPart(
            UUID uploadId,
            int partNumber,
            MultipartFile file
    ){
        User currentUser = authenticatedUserService.getCurrentUser();

        UploadSession uploadSession =
                uploadSessionRepository
                        .findByIdAndUser(uploadId, currentUser)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Upload session not found"
                                )
                        );

        if (uploadSession.getStatus() != UploadStatus.UPLOADING) {
            throw new IllegalStateException(
                    "Upload session is not accepting parts"
            );
        }

        if (partNumber < 1 ||
                partNumber > uploadSession.getTotalParts()) {
            throw new IllegalArgumentException(
                    "Invalid part number"
            );
        }

        long expectedMaxSize = uploadSession.getChunkSize();

        if (partNumber < uploadSession.getTotalParts()
                && file.getSize() != expectedMaxSize) {
            throw new IllegalArgumentException(
                    "Invalid part size"
            );
        }

        if (file.getSize() > expectedMaxSize) {
            throw new IllegalArgumentException(
                    "Part exceeds configured chunk size"
            );
        }

        try {
            String etag = storageService.uploadPart(
                    uploadSession.getObjectKey(),
                    uploadSession.getMinioUploadId(),
                    partNumber,
                    file.getInputStream(),
                    file.getSize()
            );

            UploadPart uploadPart =
                    uploadPartRepository
                            .findByUploadSessionAndPartNumber(
                                    uploadSession,
                                    partNumber
                            )
                            .orElse(
                                    UploadPart.builder()
                                            .uploadSession(uploadSession)
                                            .partNumber(partNumber)
                                            .build()
                            );

            uploadPart.setEtag(etag);
            uploadPart.setSize(file.getSize());

            uploadPartRepository.save(uploadPart);

            return new UploadPartResponse(
                    partNumber,
                    file.getSize(),
                    etag
            );

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to upload part " + partNumber,
                    e
            );
        }
    }


}