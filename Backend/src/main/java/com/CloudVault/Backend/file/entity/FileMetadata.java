package com.CloudVault.Backend.file.entity;

import com.CloudVault.Backend.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name="files")
@Builder
public class FileMetadata {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String originalFileName;

    @Column(unique = true, nullable = false, length = 255)
    private String objectKey;

    @Column(nullable = false)
    private Long size;

    @Column(nullable = false, length = 128)
    private String contentType;

    @CreationTimestamp
    private LocalDateTime uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}
