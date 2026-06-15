package com.CloudVault.Backend.sharelink.controller;

import com.CloudVault.Backend.file.dto.FileDownloadResponse;
import com.CloudVault.Backend.sharelink.service.ShareLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

/**
 * Controller for accessing shared file download links.
 *
 * Security note: The share password is accepted via the X-Share-Password request header
 * rather than a query parameter. Query parameters are logged by web servers, proxies,
 * CDNs, and appear in browser history — all of which would expose the password.
 * Headers are not logged by default and are not stored in browser history.
 */
@RestController
@RequestMapping("/share")
@RequiredArgsConstructor
public class ShareLinkController {

    private final ShareLinkService shareLinkService;

    /**
     * Downloads a file via a share token.
     *
     * @param token    the unique share token from the share URL
     * @param password optional password for password-protected shares (sent as X-Share-Password header)
     */
    @GetMapping("/{token}")
    public ResponseEntity<InputStreamResource> downloadSharedFile(
            @PathVariable String token,
            @RequestHeader(value = "X-Share-Password", required = false) String password
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
