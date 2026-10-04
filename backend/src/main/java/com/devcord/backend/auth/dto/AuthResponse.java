package com.devcord.backend.auth.dto;

import com.devcord.backend.user.dto.UserResponse;

public record AuthResponse(

        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user

) {
}