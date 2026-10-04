package com.devcord.backend.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddServerMemberRequest(

        @NotBlank
        @Size(max = 50)
        String username

) {
}