package com.devcord.backend.user.dto;

import com.devcord.backend.user.entity.UserAccount;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(

        UUID id,
        String username,
        String email,
        String role,
        Instant createdAt

) {

    public static UserResponse from(UserAccount user) {

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}