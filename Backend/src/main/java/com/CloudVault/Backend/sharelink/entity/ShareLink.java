package com.CloudVault.Backend.sharelink.entity;

import com.CloudVault.Backend.auth.entity.User;
import com.CloudVault.Backend.file.entity.FileMetadata;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "share_links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareLink {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 128)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileMetadata file;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean passwordProtected;

    @Column(length = 100)
    private String passwordHash;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
