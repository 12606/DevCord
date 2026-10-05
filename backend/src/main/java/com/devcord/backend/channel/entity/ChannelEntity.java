package com.devcord.backend.channel.entity;

import com.devcord.backend.server.entity.ServerEntity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "channels",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_channels_server_name",
                        columnNames = {
                                "server_id",
                                "name"
                        }
                )
        }
)
public class ChannelEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "server_id",
            nullable = false
    )
    private ServerEntity server;


    @Column(
            nullable = false,
            length = 80
    )
    private String name;


    @Enumerated(EnumType.STRING)
    @Column(
            name = "channel_type",
            nullable = false,
            length = 20
    )
    private ChannelType type =
            ChannelType.TEXT;


    @Column(
            nullable = false,
            updatable = false
    )
    private Instant createdAt;


    @Column(nullable = false)
    private Instant updatedAt;


    @PrePersist
    public void onCreate() {

        Instant now =
                Instant.now();

        createdAt = now;
        updatedAt = now;
    }


    @PreUpdate
    public void onUpdate() {

        updatedAt =
                Instant.now();
    }


    public UUID getId() {
        return id;
    }


    public ServerEntity getServer() {
        return server;
    }


    public void setServer(
            ServerEntity server
    ) {
        this.server = server;
    }


    public String getName() {
        return name;
    }


    public void setName(
            String name
    ) {
        this.name = name;
    }


    public ChannelType getType() {
        return type;
    }


    public void setType(
            ChannelType type
    ) {
        this.type = type;
    }


    public Instant getCreatedAt() {
        return createdAt;
    }


    public Instant getUpdatedAt() {
        return updatedAt;
    }
}