package com.devcord.backend.server.repository;

import com.devcord.backend.server.entity.ServerMember;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServerMemberRepository
        extends JpaRepository<ServerMember, UUID> {

    Optional<ServerMember>
    findByServer_IdAndUser_Id(
            UUID serverId,
            UUID userId
    );

    boolean
    existsByServer_IdAndUser_Id(
            UUID serverId,
            UUID userId
    );

    List<ServerMember>
    findAllByUser_IdOrderByJoinedAtDesc(
            UUID userId
    );

    List<ServerMember>
    findAllByServer_IdOrderByJoinedAtAsc(
            UUID serverId
    );

    long countByServer_Id(
            UUID serverId
    );

    void deleteAllByServer_Id(
            UUID serverId
    );
}