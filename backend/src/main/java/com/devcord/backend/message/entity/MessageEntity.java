package com.devcord.backend.message.entity;

import com.devcord.backend.channel.entity.ChannelEntity;
import com.devcord.backend.user.entity.UserAccount;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "messages",
        indexes = {
                @Index(
                        name = "idx_messages_channel_created_at",
                        columnList = "channel_id, created_at"
                )
        }
)
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "channel_id",
            nullable = false
    )
    private ChannelEntity channel;


    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "author_id",
            nullable = false
    )
    private UserAccount author;


    @Column(
            nullable = false,
            length = 2000
    )
    private String content;


    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private Instant createdAt;


    @PrePersist
    public void onCreate() {

        createdAt =
                Instant.now();
    }


    public UUID getId() {
        return id;
    }


    public ChannelEntity getChannel() {
        return channel;
    }


    public void setChannel(
            ChannelEntity channel
    ) {
        this.channel = channel;
    }


    public UserAccount getAuthor() {
        return author;
    }


    public void setAuthor(
            UserAccount author
    ) {
        this.author = author;
    }


    public String getContent() {
        return content;
    }


    public void setContent(
            String content
    ) {
        this.content = content;
    }


    public Instant getCreatedAt() {
        return createdAt;
    }
}