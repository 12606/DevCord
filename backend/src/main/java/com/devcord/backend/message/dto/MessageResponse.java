package com.devcord.backend.message.dto;

import com.devcord.backend.message.entity.MessageEntity;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(

        UUID id,

        UUID channelId,

        UUID authorId,

        String authorUsername,

        String content,

        Instant createdAt

) {

    public static MessageResponse from(
            MessageEntity message
    ) {

        return new MessageResponse(

                message.getId(),

                message
                        .getChannel()
                        .getId(),

                message
                        .getAuthor()
                        .getId(),

                message
                        .getAuthor()
                        .getUsername(),

                message.getContent(),

                message.getCreatedAt()
        );
    }
}