package com.devcord.backend.channel.repository;

import com.devcord.backend.channel.entity.ChannelEntity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChannelRepository
        extends JpaRepository<ChannelEntity, UUID> {

    List<ChannelEntity>
    findAllByServer_IdOrderByCreatedAtAsc(
            UUID serverId
    );


    Optional<ChannelEntity>
    findByIdAndServer_Id(
            UUID channelId,
            UUID serverId
    );


    boolean
    existsByServer_IdAndNameIgnoreCase(
            UUID serverId,
            String name
    );


    void deleteAllByServer_Id(
            UUID serverId
    );
}