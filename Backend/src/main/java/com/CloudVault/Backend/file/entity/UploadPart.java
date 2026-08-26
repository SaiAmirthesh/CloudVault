package com.CloudVault.Backend.file.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
        name = "upload_parts",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_upload_part",
                        columnNames = {"upload_session_id", "part_number"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadPart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "upload_session_id", nullable = false)
    private UploadSession uploadSession;

    @Column(name = "part_number", nullable = false)
    private int partNumber;

    @Column(nullable = false, length = 255)
    private String etag;

    @Column(nullable = false)
    private long size;
}