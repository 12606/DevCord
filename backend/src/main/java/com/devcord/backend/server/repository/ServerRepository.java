package com.devcord.backend.server.repository;

import com.devcord.backend.server.entity.ServerEntity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ServerRepository
        extends JpaRepository<ServerEntity, UUID> {
}