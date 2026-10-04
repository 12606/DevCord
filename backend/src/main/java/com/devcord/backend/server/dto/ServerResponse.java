package com.devcord.backend.server.dto;

import com.devcord.backend.server.entity.ServerEntity;
import com.devcord.backend.server.entity.ServerMember;

import java.time.Instant;
import java.util.UUID;

public record ServerResponse(

        UUID id,

        String name,

        String description,

        UUID ownerId,

        String ownerUsername,

        long memberCount,

        String currentUserRole,

        Instant createdAt

) {

    public static ServerResponse from(

            ServerEntity server,

            ServerMember membership,

            long memberCount
    ) {

        return new ServerResponse(

                server.getId(),

                server.getName(),

                server.getDescription(),

                server
                        .getOwner()
                        .getId(),

                server
                        .getOwner()
                        .getUsername(),

                memberCount,

                membership
                        .getRole()
                        .name(),

                server.getCreatedAt()
        );
    }
}