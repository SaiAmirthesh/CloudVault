package com.CloudVault.Backend.file.service;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.auth.security.AuthenticatedUserService;
import com.CloudVault.Backend.exception.ForbiddenOperationException;
import com.CloudVault.Backend.exception.ResourceNotFoundException;
import com.CloudVault.Backend.file.dto.FileDownloadResponse;
import com.CloudVault.Backend.file.dto.FileResponse;
import com.CloudVault.Backend.file.dto.FileUploadResponse;
import com.CloudVault.Backend.file.entity.FileMetadata;
import com.CloudVault.Backend.file.repository.FileMetadataRepository;
import com.CloudVault.Backend.sharelink.repository.ShareLinkRepository;
import com.CloudVault.Backend.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {
    private final StorageService storageService;
    private final FileMetadataRepository fileMetadataRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public FileUploadResponse upload(MultipartFile file) {
        User currentUser = authenticatedUserService.getCurrentUser();
        String objectKey = storageService.uploadFile(file);
        String originalFileName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
                ? "file"
                : file.getOriginalFilename();

        FileMetadata metadata = FileMetadata.builder()
                .originalFileName(originalFileName)
                .objectKey(objectKey)
                .size(file.getSize())
                .contentType(resolveContentType(file.getContentType()))
                .owner(currentUser)
                .build();

        FileMetadata saved = fileMetadataRepository.save(metadata);
        return new FileUploadResponse(saved.getId(), saved.getOriginalFileName());
    }

    @Transactional(readOnly = true)
    public Page<FileResponse> getOwnedFiles(Pageable pageable) {
        User currentUser = authenticatedUserService.getCurrentUser();
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "uploadedAt")
        );

        return fileMetadataRepository.findByOwner(currentUser, sortedPageable)
                .map(this::toFileResponse);
    }

    @Transactional(readOnly = true)
    public FileDownloadResponse download(UUID fileId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        FileMetadata file = loadOwnedFile(fileId, currentUser);
        return toDownloadResponse(file);
    }

    @Transactional
    public void delete(UUID fileId) {
        User currentUser = authenticatedUserService.getCurrentUser();
        FileMetadata file = loadOwnedFile(fileId, currentUser);

        shareLinkRepository.deleteByFile(file);
        storageService.deleteFile(file.getObjectKey());
        fileMetadataRepository.delete(file);
    }

    private FileMetadata loadOwnedFile(UUID fileId, User currentUser) {
        return fileMetadataRepository.findByIdAndOwner(fileId, currentUser)
                .orElseGet(() -> {
                    fileMetadataRepository.findById(fileId)
                            .orElseThrow(() -> new ResourceNotFoundException("File not found"));
                    throw new ForbiddenOperationException("You do not own this file");
                });
    }

    private FileResponse toFileResponse(FileMetadata file) {
        return new FileResponse(
                file.getId(),
                file.getOriginalFileName(),
                file.getSize(),
                file.getContentType(),
                file.getUploadedAt()
        );
    }

    private FileDownloadResponse toDownloadResponse(FileMetadata file) {
        return new FileDownloadResponse(
                file.getId(),
                file.getOriginalFileName(),
                file.getContentType(),
                file.getSize(),
                new InputStreamResource(storageService.downloadFile(file.getObjectKey()))
        );
    }

    private String resolveContentType(String contentType) {
        return contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType;
    }
}
