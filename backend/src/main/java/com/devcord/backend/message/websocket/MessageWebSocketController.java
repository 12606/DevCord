package com.devcord.backend.message.websocket;

import com.devcord.backend.message.dto.MessageResponse;
import com.devcord.backend.message.dto.SendMessageRequest;
import com.devcord.backend.message.service.MessageService;

import jakarta.validation.Valid;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import org.springframework.security.access.AccessDeniedException;

import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class MessageWebSocketController {

    private final MessageService messageService;

    private final SimpMessagingTemplate messagingTemplate;


    public MessageWebSocketController(
            MessageService messageService,
            SimpMessagingTemplate messagingTemplate
    ) {

        this.messageService =
                messageService;

        this.messagingTemplate =
                messagingTemplate;
    }


    @MessageMapping(
            "/servers/{serverId}/channels/{channelId}/messages"
    )
    public void sendMessage(
            Principal principal,
            @DestinationVariable UUID serverId,
            @DestinationVariable UUID channelId,
            @Valid @Payload SendMessageRequest request
    ) {

        if (principal == null) {

            throw new AccessDeniedException(
                    "Usuario WebSocket no autenticado"
            );
        }


        /*
         * PASO 1:
         * guardar en PostgreSQL.
         */
        MessageResponse message =
                messageService
                        .createMessage(
                                principal.getName(),
                                serverId,
                                channelId,
                                request
                        );


        /*
         * PASO 2:
         * solamente después de guardar,
         * enviarlo a los clientes.
         */
        messagingTemplate
                .convertAndSend(
                        "/topic/channels/"
                                + channelId,
                        message
                );
    }
}