package com.devcord.backend.message.service;

import com.devcord.backend.channel.entity.ChannelEntity;
import com.devcord.backend.channel.repository.ChannelRepository;

import com.devcord.backend.message.dto.MessageResponse;
import com.devcord.backend.message.dto.SendMessageRequest;

import com.devcord.backend.message.entity.MessageEntity;
import com.devcord.backend.message.repository.MessageRepository;

import com.devcord.backend.server.repository.ServerMemberRepository;

import com.devcord.backend.user.entity.UserAccount;
import com.devcord.backend.user.service.CurrentUserService;

import org.springframework.data.domain.PageRequest;

import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class MessageService {

    private final MessageRepository messageRepository;

    private final ChannelRepository channelRepository;

    private final ServerMemberRepository serverMemberRepository;

    private final CurrentUserService currentUserService;


    public MessageService(
            MessageRepository messageRepository,
            ChannelRepository channelRepository,
            ServerMemberRepository serverMemberRepository,
            CurrentUserService currentUserService
    ) {

        this.messageRepository =
                messageRepository;

        this.channelRepository =
                channelRepository;

        this.serverMemberRepository =
                serverMemberRepository;

        this.currentUserService =
                currentUserService;
    }


    /*
     * Obtiene los mensajes almacenados
     * de un canal.
     */
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(
            String authenticatedEmail,
            UUID serverId,
            UUID channelId,
            int limit
    ) {

        UserAccount user =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        /*
         * Seguridad:
         * comprobamos que el usuario pertenezca
         * al servidor.
         */
        requireMembership(
                serverId,
                user.getId()
        );


        /*
         * También comprobamos que el canal
         * realmente pertenezca a ese servidor.
         */
        requireChannel(
                serverId,
                channelId
        );


        /*
         * Máximo 100 mensajes por petición.
         */
        int safeLimit =
                Math.max(
                        1,
                        Math.min(
                                limit,
                                100
                        )
                );


        /*
         * PostgreSQL devuelve primero
         * los mensajes más recientes.
         */
        List<MessageEntity> entities =
                messageRepository
                        .findAllByChannel_IdOrderByCreatedAtDesc(
                                channelId,
                                PageRequest.of(
                                        0,
                                        safeLimit
                                )
                        );


        /*
         * Los invertimos para mostrarlos:
         *
         * antiguo
         * ↓
         * nuevo
         */
        List<MessageResponse> messages =
                new ArrayList<>();


        for (
                MessageEntity entity
                : entities
        ) {

            messages.add(
                    MessageResponse.from(
                            entity
                    )
            );
        }


        Collections.reverse(
                messages
        );


        return messages;
    }


    /*
     * Guarda un mensaje nuevo.
     */
    @Transactional
    public MessageResponse createMessage(
            String authenticatedEmail,
            UUID serverId,
            UUID channelId,
            SendMessageRequest request
    ) {

        UserAccount user =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        requireMembership(
                serverId,
                user.getId()
        );


        ChannelEntity channel =
                requireChannel(
                        serverId,
                        channelId
                );


        String content =
                request
                        .content()
                        .trim();


        if (content.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El mensaje no puede estar vacío"
            );
        }


        MessageEntity message =
                new MessageEntity();


        message.setChannel(
                channel
        );


        message.setAuthor(
                user
        );


        message.setContent(
                content
        );


        /*
         * saveAndFlush hace que Hibernate
         * ejecute el INSERT inmediatamente.
         *
         * Nos ayuda también a detectar errores
         * de persistencia antes del broadcast.
         */
        message =
                messageRepository
                        .saveAndFlush(
                                message
                        );


        return MessageResponse.from(
                message
        );
    }


    private void requireMembership(
            UUID serverId,
            UUID userId
    ) {

        boolean member =
                serverMemberRepository
                        .existsByServer_IdAndUser_Id(
                                serverId,
                                userId
                        );


        if (!member) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No perteneces a este servidor"
            );
        }
    }


    private ChannelEntity requireChannel(
            UUID serverId,
            UUID channelId
    ) {

        return channelRepository

                .findByIdAndServer_Id(
                        channelId,
                        serverId
                )

                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Canal no encontrado"
                                )
                );
    }
}