package com.CloudVault.Backend.file.controller;

import com.CloudVault.Backend.file.dto.CreateShareLinkRequest;
import com.CloudVault.Backend.file.dto.FileDownloadResponse;
import com.CloudVault.Backend.file.dto.FileResponse;
import com.CloudVault.Backend.file.dto.FileUploadResponse;
import com.CloudVault.Backend.file.dto.ShareLinkResponse;
import com.CloudVault.Backend.file.service.FileService;
import com.CloudVault.Backend.sharelink.service.ShareLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;
    private final ShareLinkService shareLinkService;

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.status(201).body(fileService.upload(file));
    }

    @GetMapping
    public ResponseEntity<Page<FileResponse>> getAllFiles(Pageable pageable) {
        return ResponseEntity.ok(fileService.getOwnedFiles(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InputStreamResource> download(@PathVariable UUID id) {
        FileDownloadResponse response = fileService.download(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(response.contentType()))
                .contentLength(response.size())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(response.filename(), StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(response.resource());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        fileService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<ShareLinkResponse> createShareLink(
            @PathVariable UUID id,
            @Valid @RequestBody CreateShareLinkRequest request
    ) {
        return ResponseEntity.status(201).body(shareLinkService.createShareLink(id, request));
    }
}
