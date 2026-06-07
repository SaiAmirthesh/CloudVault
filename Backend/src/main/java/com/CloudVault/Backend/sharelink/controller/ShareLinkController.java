package com.CloudVault.Backend.sharelink.controller;

import com.CloudVault.Backend.file.dto.FileDownloadResponse;
import com.CloudVault.Backend.sharelink.service.ShareLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/share")
@RequiredArgsConstructor
public class ShareLinkController {
    private final ShareLinkService shareLinkService;

    @GetMapping("/{token}")
    public ResponseEntity<InputStreamResource> downloadSharedFile(
            @PathVariable String token,
            @RequestParam(required = false) String password
    ) {
        FileDownloadResponse response = shareLinkService.downloadSharedFile(token, password);
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
}
