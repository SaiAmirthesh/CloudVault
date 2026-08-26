package com.CloudVault.Backend.file.entity;

import com.CloudVault.Backend.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name="upload_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 512)
    private String fileName;

    @Column(nullable = false, length = 255)
    private String contentType;

    @Column(nullable = false)
    private long totalSize;

    @Column(nullable = false)
    private long chunkSize;

    @Column(nullable = false)
    private int totalParts;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UploadStatus status;

    @Column(nullable = false, unique = true, length = 512)
    private String objectKey;

    @Column(nullable = false, length = 512)
    private String minioUploadId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Version
    private Long version;
}
