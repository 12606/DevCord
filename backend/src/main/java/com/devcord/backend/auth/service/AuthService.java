package com.devcord.backend.auth.service;

import com.devcord.backend.auth.dto.AuthResponse;
import com.devcord.backend.auth.dto.LoginRequest;
import com.devcord.backend.auth.dto.RegisterRequest;

import com.devcord.backend.user.dto.UserResponse;
import com.devcord.backend.user.entity.Role;
import com.devcord.backend.user.entity.UserAccount;
import com.devcord.backend.user.repository.UserRepository;
import com.devcord.backend.user.service.CustomUserDetailsService;

import org.springframework.http.HttpStatus;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final AuthenticationManager authenticationManager;

    private final CustomUserDetailsService userDetailsService;

    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            CustomUserDetailsService userDetailsService,
            JwtService jwtService
    ) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    public AuthResponse register(
            RegisterRequest request
    ) {

        String email =
                request
                        .email()
                        .trim()
                        .toLowerCase(Locale.ROOT);

        String username =
                request
                        .username()
                        .trim();

        if (
                userRepository
                        .existsByEmailIgnoreCase(email)
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El correo ya está registrado"
            );
        }

        if (
                userRepository
                        .existsByUsernameIgnoreCase(username)
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El nombre de usuario ya existe"
            );
        }

        UserAccount user =
                new UserAccount();

        user.setEmail(email);

        user.setUsername(username);

        user.setPasswordHash(
                passwordEncoder.encode(
                        request.password()
                )
        );

        user.setRole(Role.USER);

        user =
                userRepository.save(user);

        UserDetails userDetails =
                userDetailsService
                        .loadUserByUsername(email);

        String token =
                jwtService
                        .generateToken(userDetails);

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                UserResponse.from(user)
        );
    }

    public AuthResponse login(
            LoginRequest request
    ) {

        String email =
                request
                        .email()
                        .trim()
                        .toLowerCase(Locale.ROOT);

        try {

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.password()
                    )
            );

        } catch (AuthenticationException exception) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Correo o contraseña incorrectos"
            );
        }

        UserAccount user =
                userRepository
                        .findByEmailIgnoreCase(email)
                        .orElseThrow();

        UserDetails userDetails =
                userDetailsService
                        .loadUserByUsername(email);

        String token =
                jwtService
                        .generateToken(userDetails);

        return new AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                UserResponse.from(user)
        );
    }
}