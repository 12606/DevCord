package com.devcord.backend.channel.controller;

import com.devcord.backend.channel.dto.ChannelResponse;
import com.devcord.backend.channel.dto.CreateChannelRequest;
import com.devcord.backend.channel.dto.UpdateChannelRequest;

import com.devcord.backend.channel.service.ChannelService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(
        "/api/servers/{serverId}/channels"
)
public class ChannelController {

    private final ChannelService
            channelService;


    public ChannelController(
            ChannelService channelService
    ) {

        this.channelService =
                channelService;
    }


    @GetMapping
    public List<ChannelResponse> getChannels(

            Authentication authentication,

            @PathVariable
            UUID serverId
    ) {

        return channelService
                .getChannels(

                        authentication
                                .getName(),

                        serverId
                );
    }


    @PostMapping
    public ResponseEntity<ChannelResponse>
    createChannel(

            Authentication authentication,

            @PathVariable
            UUID serverId,

            @Valid
            @RequestBody
            CreateChannelRequest request
    ) {

        ChannelResponse response =
                channelService
                        .createChannel(

                                authentication
                                        .getName(),

                                serverId,

                                request
                        );


        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(response);
    }


    @PatchMapping("/{channelId}")
    public ChannelResponse updateChannel(

            Authentication authentication,

            @PathVariable
            UUID serverId,

            @PathVariable
            UUID channelId,

            @Valid
            @RequestBody
            UpdateChannelRequest request
    ) {

        return channelService
                .updateChannel(

                        authentication
                                .getName(),

                        serverId,

                        channelId,

                        request
                );
    }


    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void>
    deleteChannel(

            Authentication authentication,

            @PathVariable
            UUID serverId,

            @PathVariable
            UUID channelId
    ) {

        channelService.deleteChannel(

                authentication
                        .getName(),

                serverId,

                channelId
        );


        return ResponseEntity
                .noContent()
                .build();
    }
}