package com.devcord.backend.channel.dto;

import com.devcord.backend.channel.entity.ChannelEntity;

import java.time.Instant;
import java.util.UUID;

public record ChannelResponse(

        UUID id,

        UUID serverId,

        String name,

        String type,

        Instant createdAt

) {

    public static ChannelResponse from(
            ChannelEntity channel
    ) {

        return new ChannelResponse(

                channel.getId(),

                channel
                        .getServer()
                        .getId(),

                channel.getName(),

                channel
                        .getType()
                        .name(),

                channel.getCreatedAt()
        );
    }
}