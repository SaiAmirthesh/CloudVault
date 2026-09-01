package com.CloudVault.Backend.storage.service;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.AbortMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;

import java.io.InputStream;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;
    private final S3Client s3Client;

    @Value("${minio.bucket-name}")
    private String bucketName;

    /*
        General Upload Functions
     */

    public String uploadFile(MultipartFile file) {

        try (InputStream inputStream = file.getInputStream()) {
            String objectKey =
                    UUID.randomUUID() +
                            "-" +
                            Objects.requireNonNullElse(
                                    file.getOriginalFilename(),
                                    "file"
                            );
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(
                                    inputStream,
                                    file.getSize(),
                                    -1
                            )
                            .contentType(file.getContentType())
                            .build()
            );

            return objectKey;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to upload file",
                    e
            );
        }
    }

    public InputStream downloadFile(String objectKey) {

        try {

            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );

        } catch (Exception e) {

            throw new RuntimeException(e);
        }
    }

    public void deleteFile(String objectKey) {

        try {

            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );

        } catch (Exception e) {

            throw new RuntimeException(e);
        }
    }

     /*
        MultiPart Upload
     */

    public String initiateMultipartUpload(
            String objectKey,
            String contentType
    ) {

        try {

            CreateMultipartUploadRequest request =
                    CreateMultipartUploadRequest.builder()
                            .bucket(bucketName)
                            .key(objectKey)
                            .contentType(contentType)
                            .build();

            return s3Client
                    .createMultipartUpload(request)
                    .uploadId();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to initiate multipart upload",
                    e
            );
        }
    }


    public String uploadPart(
            String objectKey,
            String uploadId,
            int partNumber,
            InputStream inputStream,
            long partSize
    ) {

        try {

            UploadPartRequest request =
                    UploadPartRequest.builder()
                            .bucket(bucketName)
                            .key(objectKey)
                            .uploadId(uploadId)
                            .partNumber(partNumber)
                            .build();

            return s3Client
                    .uploadPart(
                            request,
                            RequestBody.fromInputStream(
                                    inputStream,
                                    partSize
                            )
                    )
                    .eTag();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to upload part " + partNumber,
                    e
            );
        }
    }


    public void completeMultipartUpload(
            String objectKey,
            String uploadId,
            List<CompletedPart> parts
    ) {

        try {

            CompletedMultipartUpload completedUpload =
                    CompletedMultipartUpload.builder()
                            .parts(parts)
                            .build();

            CompleteMultipartUploadRequest request =
                    CompleteMultipartUploadRequest.builder()
                            .bucket(bucketName)
                            .key(objectKey)
                            .uploadId(uploadId)
                            .multipartUpload(completedUpload)
                            .build();

            s3Client.completeMultipartUpload(request);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to complete multipart upload",
                    e
            );
        }
    }


    public void abortMultipartUpload(
            String objectKey,
            String uploadId
    ) {

        try {

            AbortMultipartUploadRequest request =
                    AbortMultipartUploadRequest.builder()
                            .bucket(bucketName)
                            .key(objectKey)
                            .uploadId(uploadId)
                            .build();

            s3Client.abortMultipartUpload(request);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to abort multipart upload",
                    e
            );
        }
    }
}