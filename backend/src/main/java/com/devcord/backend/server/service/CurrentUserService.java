package com.devcord.backend.user.service;

import com.devcord.backend.user.entity.UserAccount;
import com.devcord.backend.user.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(
            UserRepository userRepository
    ) {

        this.userRepository =
                userRepository;
    }

    public UserAccount requireByEmail(
            String email
    ) {

        return userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Usuario autenticado no encontrado"
                                )
                );
    }
}