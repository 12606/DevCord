package com.devcord.backend.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateServerRequest(

        @NotBlank
        @Size(
                min = 3,
                max = 80
        )
        String name,

        @Size(max = 500)
        String description

) {
}