package com.devcord.backend.server.entity;

import com.devcord.backend.user.entity.UserAccount;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "servers")
public class ServerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(
            nullable = false,
            length = 80
    )
    private String name;

    @Column(
            length = 500
    )
    private String description;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "owner_id",
            nullable = false
    )
    private UserAccount owner;

    @Column(
            nullable = false,
            updatable = false
    )
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;


    @PrePersist
    public void onCreate() {

        Instant now = Instant.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {

        updatedAt = Instant.now();
    }


    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(
            String name
    ) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description
    ) {
        this.description = description;
    }

    public UserAccount getOwner() {
        return owner;
    }

    public void setOwner(
            UserAccount owner
    ) {
        this.owner = owner;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}