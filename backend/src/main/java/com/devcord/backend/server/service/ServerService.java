package com.devcord.backend.server.service;

import com.devcord.backend.server.dto.AddServerMemberRequest;
import com.devcord.backend.server.dto.CreateServerRequest;
import com.devcord.backend.server.dto.ServerMemberResponse;
import com.devcord.backend.server.dto.ServerResponse;
import com.devcord.backend.server.dto.UpdateServerRequest;

import com.devcord.backend.server.entity.ServerEntity;
import com.devcord.backend.server.entity.ServerMember;
import com.devcord.backend.server.entity.ServerRole;

import com.devcord.backend.server.repository.ServerMemberRepository;
import com.devcord.backend.server.repository.ServerRepository;

import com.devcord.backend.user.entity.UserAccount;
import com.devcord.backend.user.repository.UserRepository;
import com.devcord.backend.user.service.CurrentUserService;
import com.devcord.backend.channel.repository.ChannelRepository;
import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ServerService {

    private final ServerRepository serverRepository;
    private final ChannelRepository channelRepository;
    private final ServerMemberRepository
            serverMemberRepository;

    private final UserRepository userRepository;

    private final CurrentUserService
            currentUserService;


    public ServerService(

        ServerRepository serverRepository,

        ServerMemberRepository
                serverMemberRepository,

        UserRepository userRepository,

        CurrentUserService
                currentUserService,

        ChannelRepository
                channelRepository
) {

    this.serverRepository =
            serverRepository;

    this.serverMemberRepository =
            serverMemberRepository;

    this.userRepository =
            userRepository;

    this.currentUserService =
            currentUserService;

    this.channelRepository =
            channelRepository;
}


    @Transactional
    public ServerResponse createServer(

            String authenticatedEmail,

            CreateServerRequest request
    ) {

        UserAccount currentUser =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        ServerEntity server =
                new ServerEntity();

        server.setName(
                request.name().trim()
        );

        server.setDescription(
                normalizeDescription(
                        request.description()
                )
        );

        server.setOwner(currentUser);


        server =
                serverRepository.save(server);


        ServerMember ownerMembership =
                new ServerMember();

        ownerMembership.setServer(server);

        ownerMembership.setUser(
                currentUser
        );

        ownerMembership.setRole(
                ServerRole.OWNER
        );


        ownerMembership =
                serverMemberRepository
                        .save(
                                ownerMembership
                        );


        return ServerResponse.from(

                server,

                ownerMembership,

                1
        );
    }


    @Transactional(readOnly = true)
    public List<ServerResponse> getServersForUser(
            String authenticatedEmail
    ) {

        UserAccount currentUser =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        return serverMemberRepository

                .findAllByUser_IdOrderByJoinedAtDesc(
                        currentUser.getId()
                )

                .stream()

                .map(
                        membership ->
                                ServerResponse.from(

                                        membership
                                                .getServer(),

                                        membership,

                                        serverMemberRepository
                                                .countByServer_Id(
                                                        membership
                                                                .getServer()
                                                                .getId()
                                                )
                                )
                )

                .toList();
    }


    @Transactional(readOnly = true)
    public ServerResponse getServer(

            String authenticatedEmail,

            UUID serverId
    ) {

        UserAccount currentUser =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        ServerMember membership =
                requireMembership(

                        serverId,

                        currentUser.getId()
                );


        ServerEntity server =
                membership.getServer();


        return ServerResponse.from(

                server,

                membership,

                serverMemberRepository
                        .countByServer_Id(
                                serverId
                        )
        );
    }


    @Transactional
    public ServerResponse updateServer(

            String authenticatedEmail,

            UUID serverId,

            UpdateServerRequest request
    ) {

        UserAccount currentUser =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        ServerMember membership =
                requireMembership(

                        serverId,

                        currentUser.getId()
                );


        requireAdminOrOwner(
                membership
        );


        ServerEntity server =
                membership.getServer();


        if (request.name() != null) {

            server.setName(
                    request
                            .name()
                            .trim()
            );
        }


        if (request.description() != null) {

            server.setDescription(
                    normalizeDescription(
                            request.description()
                    )
            );
        }


        server =
                serverRepository.save(server);


        return ServerResponse.from(

                server,

                membership,

                serverMemberRepository
                        .countByServer_Id(
                                serverId
                        )
        );
    }


    @Transactional
    public void deleteServer(

            String authenticatedEmail,

            UUID serverId
    ) {

        UserAccount currentUser =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        ServerMember membership =
                requireMembership(

                        serverId,

                        currentUser.getId()
                );


        if (
                membership.getRole()
                        != ServerRole.OWNER
        ) {

            throw new ResponseStatusException(

                    HttpStatus.FORBIDDEN,

                    "Solo el propietario puede eliminar el servidor"
            );
        }
        channelRepository
        .deleteAllByServer_Id(
                serverId
        );

        serverMemberRepository
                .deleteAllByServer_Id(
                        serverId
                );


        serverRepository
                .deleteById(
                        serverId
                );
    }


    @Transactional(readOnly = true)
    public List<ServerMemberResponse> getMembers(

            String authenticatedEmail,

            UUID serverId
    ) {

        UserAccount currentUser =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        requireMembership(

                serverId,

                currentUser.getId()
        );


        return serverMemberRepository

                .findAllByServer_IdOrderByJoinedAtAsc(
                        serverId
                )

                .stream()

                .map(
                        ServerMemberResponse::from
                )

                .toList();
    }


    @Transactional
    public ServerMemberResponse addMember(

            String authenticatedEmail,

            UUID serverId,

            AddServerMemberRequest request
    ) {

        UserAccount currentUser =
                currentUserService
                        .requireByEmail(
                                authenticatedEmail
                        );


        ServerMember currentMembership =
                requireMembership(

                        serverId,

                        currentUser.getId()
                );


        requireAdminOrOwner(
                currentMembership
        );


        UserAccount userToAdd =
                userRepository

                        .findByUsernameIgnoreCase(
                                request
                                        .username()
                                        .trim()
                        )

                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(

                                                HttpStatus.NOT_FOUND,

                                                "El usuario no existe"
                                        )
                        );


        if (
                serverMemberRepository
                        .existsByServer_IdAndUser_Id(

                                serverId,

                                userToAdd.getId()
                        )
        ) {

            throw new ResponseStatusException(

                    HttpStatus.CONFLICT,

                    "El usuario ya pertenece al servidor"
            );
        }


        ServerEntity server =
                serverRepository

                        .findById(serverId)

                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(

                                                HttpStatus.NOT_FOUND,

                                                "Servidor no encontrado"
                                        )
                        );


        ServerMember membership =
                new ServerMember();


        membership.setServer(server);

        membership.setUser(
                userToAdd
        );

        membership.setRole(
                ServerRole.MEMBER
        );


        membership =
                serverMemberRepository
                        .save(membership);


        return ServerMemberResponse.from(
                membership
        );
    }


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

                    "No tienes permisos para realizar esta acción"
            );
        }
    }


    private String normalizeDescription(
            String description
    ) {

        if (description == null) {
            return null;
        }


        String trimmed =
                description.trim();


        return trimmed.isEmpty()
                ? null
                : trimmed;
    }
}