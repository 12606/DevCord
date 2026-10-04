package com.devcord.backend.server.entity;

import com.devcord.backend.user.entity.UserAccount;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "server_members",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_server_member",
                        columnNames = {
                                "server_id",
                                "user_id"
                        }
                )
        }
)
public class ServerMember {

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

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 20
    )
    private ServerRole role;

    @Column(
            nullable = false,
            updatable = false
    )
    private Instant joinedAt;


    @PrePersist
    public void onCreate() {

        joinedAt = Instant.now();
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

    public UserAccount getUser() {
        return user;
    }

    public void setUser(
            UserAccount user
    ) {
        this.user = user;
    }

    public ServerRole getRole() {
        return role;
    }

    public void setRole(
            ServerRole role
    ) {
        this.role = role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}