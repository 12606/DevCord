package com.devcord.backend.message.controller;

import com.devcord.backend.message.dto.MessageResponse;
import com.devcord.backend.message.service.MessageService;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(
        "/api/servers/{serverId}/channels/{channelId}/messages"
)
public class MessageController {

    private final MessageService messageService;


    public MessageController(
            MessageService messageService
    ) {

        this.messageService =
                messageService;
    }


    @GetMapping
    public List<MessageResponse> getMessages(
            Authentication authentication,
            @PathVariable UUID serverId,
            @PathVariable UUID channelId,
            @RequestParam(
                    defaultValue = "50"
            )
            int limit
    ) {

        return messageService
                .getMessages(
                        authentication.getName(),
                        serverId,
                        channelId,
                        limit
                );
    }
}