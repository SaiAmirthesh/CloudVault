package com.CloudVault.Backend.storage.service;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class StorageService {
    private final MinioClient minioClient;
    @Value("${minio.bucket-name}")
    private String bucketName;

    public String uploadFile(MultipartFile file) {

        try {

            String objectKey =
                    UUID.randomUUID() +
                            "-" +
                            Objects.requireNonNullElse(file.getOriginalFilename(), "file");

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(
                                    file.getInputStream(),
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

    public InputStream downloadFile(String objectKey){
        try{
            return minioClient.getObject(
                    GetObjectArgs.builder().bucket(bucketName).object(objectKey).build()
            );
        }catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    public void deleteFile(String objectKey){
        try{
            minioClient.removeObject(
                    RemoveObjectArgs.builder().bucket(bucketName).object(objectKey).build()
            );
        }catch(Exception e){
            throw new RuntimeException(e);
        }
    }


}
