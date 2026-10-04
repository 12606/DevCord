package com.devcord.backend.server.dto;

import com.devcord.backend.server.entity.ServerMember;

import java.time.Instant;
import java.util.UUID;

public record ServerMemberResponse(

        UUID userId,
        String username,
        String role,
        Instant joinedAt

) {

    public static ServerMemberResponse from(
            ServerMember member
    ) {

        return new ServerMemberResponse(

                member
                        .getUser()
                        .getId(),

                member
                        .getUser()
                        .getUsername(),

                member
                        .getRole()
                        .name(),

                member
                        .getJoinedAt()
        );
    }
}