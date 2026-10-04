package com.devcord.backend.user.controller;

import com.devcord.backend.user.dto.UserResponse;
import com.devcord.backend.user.entity.UserAccount;
import com.devcord.backend.user.repository.UserRepository;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(
            UserRepository userRepository
    ) {

        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser(
            Authentication authentication
    ) {

        UserAccount user =
                userRepository
                        .findByEmailIgnoreCase(
                                authentication.getName()
                        )
                        .orElseThrow();

        return UserResponse.from(user);
    }
}