package com.CloudVault.Backend.file.service;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.auth.security.AuthenticatedUserService;
import com.CloudVault.Backend.exception.ResourceNotFoundException;
import com.CloudVault.Backend.file.dto.FileUploadResponse;
import com.CloudVault.Backend.file.dto.StartUploadRequest;
import com.CloudVault.Backend.file.dto.StartUploadResponse;
import com.CloudVault.Backend.file.dto.UploadPartResponse;
import com.CloudVault.Backend.file.dto.UploadStatusResponse;
import com.CloudVault.Backend.file.entity.FileMetadata;
import com.CloudVault.Backend.file.entity.UploadPart;
import com.CloudVault.Backend.file.entity.UploadSession;
import com.CloudVault.Backend.file.entity.UploadStatus;
import com.CloudVault.Backend.file.repository.FileMetadataRepository;
import com.CloudVault.Backend.file.repository.UploadPartRepository;
import com.CloudVault.Backend.file.repository.UploadSessionRepository;
import com.CloudVault.Backend.kafka.event.FileUploadedEvent;
import com.CloudVault.Backend.kafka.entity.OutboxEvent;
import com.CloudVault.Backend.kafka.entity.OutboxStatus;
import com.CloudVault.Backend.kafka.repository.OutboxEventRepository;
import com.CloudVault.Backend.storage.service.StorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.TransactionTemplate;
import software.amazon.awssdk.services.s3.model.CompletedPart;

import java.io.InputStream;
import java.time.LocalDateTime;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class UploadService {

    private static final long CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB

    private final UploadSessionRepository uploadSessionRepository;
    private final StorageService storageService;
    private final AuthenticatedUserService authenticatedUserService;
    private final UploadPartRepository uploadPartRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final TransactionTemplate transactionTemplate;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public StartUploadResponse startUpload(StartUploadRequest request) {

        User currentUser = authenticatedUserService.getCurrentUser();

        int totalParts = (int) Math.ceil(
                (double) request.totalSize() / CHUNK_SIZE
        );

        if (totalParts > 10000) {
            throw new IllegalArgumentException(
                    "Upload size exceeds maximum allowed parts"
            );
        }

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

        UploadSession savedSession;

        try {
            savedSession = uploadSessionRepository.save(uploadSession);
        } catch (Exception e) {

            try {
                storageService.abortMultipartUpload(
                        objectKey,
                        minioUploadId
                );
            } catch (Exception ignored) {
            }

            throw e;
        }

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

        String safeName =
                fileName == null || fileName.isBlank()
                        ? "file"
                        : fileName.replaceAll(
                        "[^a-zA-Z0-9._-]",
                        "_"
                );

        if (safeName.length() > 50) {
            safeName =
                    safeName.substring(
                            safeName.length() - 50
                    );
        }

        return "uploads/"
                + userId
                + "/"
                + UUID.randomUUID()
                + "-"
                + safeName;
    }

    public UploadPartResponse uploadPart(
            UUID uploadId,
            int partNumber,
            MultipartFile file
    ) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Part file cannot be empty"
            );
        }

        User currentUser =
                authenticatedUserService.getCurrentUser();

        UploadSession uploadSession =
                uploadSessionRepository
                        .findByIdAndUser(
                                uploadId,
                                currentUser
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Upload session not found"
                                )
                        );

        if (uploadSession.getStatus()
                != UploadStatus.UPLOADING) {

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

        long expectedMaxSize =
                uploadSession.getChunkSize();

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

        try (InputStream inputStream = file.getInputStream()) {

            String etag =
                    storageService.uploadPart(
                            uploadSession.getObjectKey(),
                            uploadSession.getMinioUploadId(),
                            partNumber,
                            inputStream,
                            file.getSize()
                    );

            UploadPart uploadPart =
                    uploadPartRepository
                            .findByUploadSessionAndPartNumber(
                                    uploadSession,
                                    partNumber
                            )
                            .orElse(null);

            if (uploadPart == null) {

                try {

                    uploadPart =
                            UploadPart.builder()
                                    .uploadSession(uploadSession)
                                    .partNumber(partNumber)
                                    .etag(etag)
                                    .size(file.getSize())
                                    .build();

                    uploadPartRepository.saveAndFlush(
                            uploadPart
                    );

                } catch (DataIntegrityViolationException ex) {

                    uploadPart =
                            uploadPartRepository
                                    .findByUploadSessionAndPartNumber(
                                            uploadSession,
                                            partNumber
                                    )
                                    .orElseThrow(() ->
                                            new RuntimeException(
                                                    "Concurrent insert failed to retrieve part"
                                            )
                                    );

                    uploadPart.setEtag(etag);
                    uploadPart.setSize(file.getSize());

                    uploadPartRepository.save(uploadPart);
                }

            } else {

                uploadPart.setEtag(etag);
                uploadPart.setSize(file.getSize());

                uploadPartRepository.save(uploadPart);
            }

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

    @Transactional(readOnly = true)
    public UploadStatusResponse getUploadStatus(
            UUID uploadId
    ) {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        UploadSession session =
                uploadSessionRepository
                        .findByIdAndUser(
                                uploadId,
                                currentUser
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Upload session not found"
                                )
                        );

        List<UploadPart> parts =
                uploadPartRepository
                        .findByUploadSessionOrderByPartNumberAsc(
                                session
                        );

        List<Integer> uploadedParts =
                parts.stream()
                        .map(UploadPart::getPartNumber)
                        .sorted()
                        .toList();

        Set<Integer> uploadedSet =
                new HashSet<>(uploadedParts);

        List<Integer> missingParts =
                IntStream
                        .rangeClosed(
                                1,
                                session.getTotalParts()
                        )
                        .filter(p ->
                                !uploadedSet.contains(p)
                        )
                        .boxed()
                        .toList();

        return new UploadStatusResponse(
                session.getId(),
                session.getFileName(),
                session.getTotalSize(),
                session.getTotalParts(),
                session.getStatus(),
                uploadedParts,
                missingParts
        );
    }

    public FileUploadResponse completeUpload(
            UUID uploadId
    ) {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        UploadSession session =
                uploadSessionRepository
                        .findByIdAndUser(
                                uploadId,
                                currentUser
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Upload session not found"
                                )
                        );

        if (session.getStatus() != UploadStatus.UPLOADING
                && session.getStatus() != UploadStatus.COMPLETING) {

            throw new IllegalStateException(
                    "Upload session is not in UPLOADING or COMPLETING state"
            );
        }

        List<UploadPart> parts =
                uploadPartRepository
                        .findByUploadSessionOrderByPartNumberAsc(
                                session
                        );

        if (parts.size() != session.getTotalParts()) {

            Set<Integer> uploadedSet =
                    parts.stream()
                            .map(UploadPart::getPartNumber)
                            .collect(Collectors.toSet());

            List<Integer> missingParts =
                    IntStream
                            .rangeClosed(
                                    1,
                                    session.getTotalParts()
                            )
                            .filter(p ->
                                    !uploadedSet.contains(p)
                            )
                            .boxed()
                            .toList();

            throw new IllegalStateException(
                    "Cannot complete upload: missing parts "
                            + missingParts
            );
        }

        session.setStatus(UploadStatus.COMPLETING);

        session =
                uploadSessionRepository.saveAndFlush(
                        session
                );

        List<CompletedPart> completedParts =
                parts.stream()
                        .map(p ->
                                CompletedPart.builder()
                                        .partNumber(
                                                p.getPartNumber()
                                        )
                                        .eTag(
                                                p.getEtag()
                                        )
                                        .build()
                        )
                        .toList();

        try {

            storageService.completeMultipartUpload(
                    session.getObjectKey(),
                    session.getMinioUploadId(),
                    completedParts
            );

        } catch (Exception e) {

            if (e.getMessage() == null ||
                    !e.getMessage()
                            .contains("NoSuchUpload")) {

                session.setStatus(
                        UploadStatus.UPLOADING
                );

                session =
                        uploadSessionRepository
                                .saveAndFlush(session);

                throw e;
            }
        }

        long trueSize =
                parts.stream()
                        .mapToLong(UploadPart::getSize)
                        .sum();

        final UploadSession finalSession = session;

        FileMetadata savedFile =
                transactionTemplate.execute(status -> {

                    FileMetadata metadata =
                            FileMetadata.builder()
                                    .originalFileName(
                                            finalSession.getFileName()
                                    )
                                    .objectKey(
                                            finalSession.getObjectKey()
                                    )
                                    .size(trueSize)
                                    .contentType(
                                            finalSession.getContentType()
                                                    == null
                                                    || finalSession
                                                    .getContentType()
                                                    .isBlank()
                                                    ? "application/octet-stream"
                                                    : finalSession
                                                      .getContentType()
                                    )
                                    .owner(currentUser)
                                    .build();

                    FileMetadata saved =
                            fileMetadataRepository.save(
                                    metadata
                            );

                    finalSession.setStatus(
                            UploadStatus.COMPLETED
                    );

                    uploadSessionRepository.save(
                            finalSession
                    );

                    /*
                     * We persist the Kafka event into the Outbox table
                     * within the same database transaction.
                     */
                    FileUploadedEvent event =
                            new FileUploadedEvent(
                                    UUID.randomUUID(),
                                    saved.getId(),
                                    currentUser.getId(),
                                    saved.getOriginalFileName(),
                                    saved.getContentType(),
                                    saved.getSize(),
                                    saved.getObjectKey()
                            );

                    try {
                        OutboxEvent outboxEvent = OutboxEvent.builder()
                                .id(UUID.randomUUID())
                                .aggregateType("FileMetadata")
                                .aggregateId(saved.getId().toString())
                                .eventType("FILE_UPLOADED")
                                .payload(objectMapper.writeValueAsString(event))
                                .status(OutboxStatus.PENDING)
                                .createdAt(LocalDateTime.now())
                                .build();
                        outboxEventRepository.save(outboxEvent);
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to serialize event", e);
                    }

                    return saved;
                });

        return new FileUploadResponse(
                savedFile.getId(),
                savedFile.getOriginalFileName()
        );
    }

    public void abortUpload(UUID uploadId) {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        UploadSession session =
                uploadSessionRepository
                        .findByIdAndUser(
                                uploadId,
                                currentUser
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Upload session not found"
                                )
                        );

        try {

            storageService.abortMultipartUpload(
                    session.getObjectKey(),
                    session.getMinioUploadId()
            );

        } catch (Exception e) {

            if (e.getMessage() == null ||
                    !e.getMessage()
                            .contains("NoSuchUpload")) {

                throw e;
            }
        }

        transactionTemplate.executeWithoutResult(
                status -> {

                    uploadPartRepository
                            .deleteByUploadSession(
                                    session
                            );

                    uploadSessionRepository.delete(
                            session
                    );
                }
        );
    }
}