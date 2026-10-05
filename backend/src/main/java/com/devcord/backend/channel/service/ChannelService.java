package com.devcord.backend.channel.service;

import com.devcord.backend.channel.dto.ChannelResponse;
import com.devcord.backend.channel.dto.CreateChannelRequest;
import com.devcord.backend.channel.dto.UpdateChannelRequest;
import com.devcord.backend.channel.entity.ChannelEntity;
import com.devcord.backend.channel.entity.ChannelType;
import com.devcord.backend.channel.repository.ChannelRepository;

import com.devcord.backend.message.repository.MessageRepository;

import com.devcord.backend.server.entity.ServerMember;
import com.devcord.backend.server.entity.ServerRole;
import com.devcord.backend.server.repository.ServerMemberRepository;

import com.devcord.backend.user.entity.UserAccount;
import com.devcord.backend.user.service.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ChannelService {

    private final ChannelRepository channelRepository;

    private final ServerMemberRepository serverMemberRepository;

    private final CurrentUserService currentUserService;

    private final MessageRepository messageRepository;


    public ChannelService(
            ChannelRepository channelRepository,
            ServerMemberRepository serverMemberRepository,
            CurrentUserService currentUserService,
            MessageRepository messageRepository
    ) {

        this.channelRepository =
                channelRepository;

        this.serverMemberRepository =
                serverMemberRepository;

        this.currentUserService =
                currentUserService;

        this.messageRepository =
                messageRepository;
    }


    /**
     * Obtiene todos los canales de un servidor.
     *
     * El usuario debe pertenecer al servidor
     * para poder consultar sus canales.
     */
    @Transactional(readOnly = true)
    public List<ChannelResponse> getChannels(
            String authenticatedEmail,
            UUID serverId
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


        return channelRepository

                .findAllByServer_IdOrderByCreatedAtAsc(
                        serverId
                )

                .stream()

                .map(
                        ChannelResponse::from
                )

                .toList();
    }


    /**
     * Crea un canal dentro de un servidor.
     *
     * Solamente OWNER o ADMIN pueden hacerlo.
     */
    @Transactional
    public ChannelResponse createChannel(
            String authenticatedEmail,
            UUID serverId,
            CreateChannelRequest request
    ) {

        UserAccount user =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        ServerMember membership =
                requireMembership(
                        serverId,
                        user.getId()
                );


        requireAdminOrOwner(
                membership
        );


        String channelName =
                normalizeChannelName(
                        request.name()
                );


        if (
                channelRepository
                        .existsByServer_IdAndNameIgnoreCase(
                                serverId,
                                channelName
                        )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un canal con ese nombre"
            );
        }


        ChannelEntity channel =
                new ChannelEntity();


        channel.setServer(
                membership.getServer()
        );


        channel.setName(
                channelName
        );


        channel.setType(
                ChannelType.TEXT
        );


        channel =
                channelRepository.save(
                        channel
                );


        return ChannelResponse.from(
                channel
        );
    }


    /**
     * Modifica el nombre de un canal.
     *
     * Solamente OWNER o ADMIN pueden hacerlo.
     */
    @Transactional
    public ChannelResponse updateChannel(
            String authenticatedEmail,
            UUID serverId,
            UUID channelId,
            UpdateChannelRequest request
    ) {

        UserAccount user =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        ServerMember membership =
                requireMembership(
                        serverId,
                        user.getId()
                );


        requireAdminOrOwner(
                membership
        );


        ChannelEntity channel =
                requireChannel(
                        serverId,
                        channelId
                );


        String newName =
                normalizeChannelName(
                        request.name()
                );


        if (
                !channel
                        .getName()
                        .equalsIgnoreCase(
                                newName
                        )

                        &&

                channelRepository
                        .existsByServer_IdAndNameIgnoreCase(
                                serverId,
                                newName
                        )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un canal con ese nombre"
            );
        }


        channel.setName(
                newName
        );


        channel =
                channelRepository.save(
                        channel
                );


        return ChannelResponse.from(
                channel
        );
    }


    /**
     * Elimina un canal.
     *
     * Primero se eliminan sus mensajes porque
     * messages.channel_id depende del canal.
     */
    @Transactional
    public void deleteChannel(
            String authenticatedEmail,
            UUID serverId,
            UUID channelId
    ) {

        UserAccount user =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        ServerMember membership =
                requireMembership(
                        serverId,
                        user.getId()
                );


        requireAdminOrOwner(
                membership
        );


        ChannelEntity channel =
                requireChannel(
                        serverId,
                        channelId
                );


        /*
         * Primero eliminamos los mensajes
         * asociados al canal.
         */
        messageRepository
                .deleteAllByChannel_Id(
                        channelId
                );


        /*
         * Después podemos eliminar el canal.
         */
        channelRepository.delete(
                channel
        );
    }


    /**
     * Comprueba que el usuario pertenezca
     * al servidor.
     */
    private ServerMember requireMembership(
            UUID serverId,
            UUID userId
    ) {

        return serverMemberRepository

                .findByServer_IdAndUser_Id(
                        serverId,
                        userId
                )

                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "No perteneces a este servidor"
                                )
                );
    }


    /**
     * Comprueba que el canal exista y además
     * pertenezca al servidor indicado.
     */
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


    /**
     * Comprueba permisos de administración.
     */
    private void requireAdminOrOwner(
            ServerMember membership
    ) {

        ServerRole role =
                membership.getRole();


        if (
                role != ServerRole.OWNER
                        &&
                role != ServerRole.ADMIN
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tienes permisos para administrar canales"
            );
        }
    }


    /**
     * Normaliza nombres de canales.
     *
     * Ejemplo:
     *
     * "Backend Java"
     *
     * se convierte en:
     *
     * "backend-java"
     */
    private String normalizeChannelName(
            String name
    ) {

        String normalized =
                name

                        .trim()

                        .toLowerCase(
                                Locale.ROOT
                        )

                        .replaceAll(
                                "\\s+",
                                "-"
                        )

                        .replaceAll(
                                "[^\\p{L}\\p{N}_-]",
                                ""
                        );


        if (
                normalized.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre del canal no es válido"
            );
        }


        return normalized;
    }
}