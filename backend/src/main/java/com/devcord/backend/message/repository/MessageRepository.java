package com.devcord.backend.message.repository;

import com.devcord.backend.message.entity.MessageEntity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository
        extends JpaRepository<MessageEntity, UUID> {

    List<MessageEntity>
    findAllByChannel_IdOrderByCreatedAtDesc(
            UUID channelId,
            Pageable pageable
    );


    void deleteAllByChannel_Id(
            UUID channelId
    );


    void deleteAllByChannel_Server_Id(
            UUID serverId
    );
}