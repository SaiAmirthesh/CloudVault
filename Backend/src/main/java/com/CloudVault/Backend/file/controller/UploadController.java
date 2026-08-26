package com.CloudVault.Backend.file.controller;

import com.CloudVault.Backend.file.dto.FileUploadResponse;
import com.CloudVault.Backend.file.dto.StartUploadRequest;
import com.CloudVault.Backend.file.dto.StartUploadResponse;
import com.CloudVault.Backend.file.dto.UploadPartResponse;
import com.CloudVault.Backend.file.dto.UploadStatusResponse;
import com.CloudVault.Backend.file.service.UploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    @PostMapping
    public ResponseEntity<StartUploadResponse> startUpload(
            @Valid @RequestBody StartUploadRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(uploadService.startUpload(request));
    }

    @PutMapping("/{uploadId}/parts/{partNumber}")
    public ResponseEntity<UploadPartResponse> uploadPart(
            @PathVariable UUID uploadId,
            @PathVariable int partNumber,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(
                uploadService.uploadPart(
                        uploadId,
                        partNumber,
                        file
                )
        );
    }

    @GetMapping("/{uploadId}")
    public ResponseEntity<UploadStatusResponse> getUploadStatus(
            @PathVariable UUID uploadId
    ) {
        return ResponseEntity.ok(uploadService.getUploadStatus(uploadId));
    }

    @PostMapping("/{uploadId}/complete")
    public ResponseEntity<FileUploadResponse> completeUpload(
            @PathVariable UUID uploadId
    ) {
        return ResponseEntity.ok(uploadService.completeUpload(uploadId));
    }

    @DeleteMapping("/{uploadId}")
    public ResponseEntity<Void> abortUpload(
            @PathVariable UUID uploadId
    ) {
        uploadService.abortUpload(uploadId);
        return ResponseEntity.noContent().build();
    }
}