package com.devcord.backend.channel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateChannelRequest(

        @NotBlank
        @Size(
                min = 1,
                max = 80
        )
        String name

) {
}