package com.devcord.backend.server.controller;

import com.devcord.backend.server.dto.AddServerMemberRequest;
import com.devcord.backend.server.dto.CreateServerRequest;
import com.devcord.backend.server.dto.ServerMemberResponse;
import com.devcord.backend.server.dto.ServerResponse;
import com.devcord.backend.server.dto.UpdateServerRequest;

import com.devcord.backend.server.service.ServerService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/servers")
public class ServerController {

    private final ServerService
            serverService;


    public ServerController(
            ServerService serverService
    ) {

        this.serverService =
                serverService;
    }


    @PostMapping
    public ResponseEntity<ServerResponse> createServer(

            Authentication authentication,

            @Valid
            @RequestBody
            CreateServerRequest request
    ) {

        ServerResponse response =
                serverService.createServer(

                        authentication.getName(),

                        request
                );


        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(response);
    }


    @GetMapping
    public List<ServerResponse> getServers(
            Authentication authentication
    ) {

        return serverService
                .getServersForUser(
                        authentication.getName()
                );
    }


    @GetMapping("/{serverId}")
    public ServerResponse getServer(

            Authentication authentication,

            @PathVariable
            UUID serverId
    ) {

        return serverService.getServer(

                authentication.getName(),

                serverId
        );
    }


    @PatchMapping("/{serverId}")
    public ServerResponse updateServer(

            Authentication authentication,

            @PathVariable
            UUID serverId,

            @Valid
            @RequestBody
            UpdateServerRequest request
    ) {

        return serverService.updateServer(

                authentication.getName(),

                serverId,

                request
        );
    }


    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> deleteServer(

            Authentication authentication,

            @PathVariable
            UUID serverId
    ) {

        serverService.deleteServer(

                authentication.getName(),

                serverId
        );


        return ResponseEntity
                .noContent()
                .build();
    }


    @GetMapping("/{serverId}/members")
    public List<ServerMemberResponse> getMembers(

            Authentication authentication,

            @PathVariable
            UUID serverId
    ) {

        return serverService.getMembers(

                authentication.getName(),

                serverId
        );
    }


    @PostMapping("/{serverId}/members")
    public ResponseEntity<ServerMemberResponse> addMember(

            Authentication authentication,

            @PathVariable
            UUID serverId,

            @Valid
            @RequestBody
            AddServerMemberRequest request
    ) {

        ServerMemberResponse response =
                serverService.addMember(

                        authentication.getName(),

                        serverId,

                        request
                );


        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(response);
    }
}