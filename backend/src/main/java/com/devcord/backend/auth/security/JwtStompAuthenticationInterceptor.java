package com.devcord.backend.auth.security;

import com.devcord.backend.auth.service.JwtService;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;

import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

import org.springframework.security.access.AccessDeniedException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import org.springframework.stereotype.Component;

@Component
public class JwtStompAuthenticationInterceptor
        implements ChannelInterceptor {

    private final JwtService
            jwtService;

    private final UserDetailsService
            userDetailsService;


    public JwtStompAuthenticationInterceptor(

            JwtService jwtService,

            UserDetailsService
                    userDetailsService
    ) {

        this.jwtService =
                jwtService;

        this.userDetailsService =
                userDetailsService;
    }


    @Override
    public Message<?> preSend(

            Message<?> message,

            MessageChannel channel
    ) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor
                        .getAccessor(

                                message,

                                StompHeaderAccessor.class
                        );


        if (
                accessor != null
                        &&
                StompCommand.CONNECT
                        .equals(
                                accessor.getCommand()
                        )
        ) {

            String authorization =
                    accessor
                            .getFirstNativeHeader(
                                    "Authorization"
                            );


            if (
                    authorization == null
                            ||
                    !authorization.startsWith(
                            "Bearer "
                    )
            ) {

                throw new AccessDeniedException(
                        "Token WebSocket no proporcionado"
                );
            }


            String token =
                    authorization.substring(7);


            try {

                String email =
                        jwtService
                                .extractUsername(
                                        token
                                );


                UserDetails userDetails =
                        userDetailsService
                                .loadUserByUsername(
                                        email
                                );


                if (
                        !jwtService
                                .isTokenValid(

                                        token,

                                        userDetails
                                )
                ) {

                    throw new AccessDeniedException(
                            "Token WebSocket inválido"
                    );
                }


                UsernamePasswordAuthenticationToken
                        authentication =

                        new UsernamePasswordAuthenticationToken(

                                userDetails,

                                null,

                                userDetails
                                        .getAuthorities()
                        );


                /*
                 * Asociamos el usuario autenticado
                 * con la sesión STOMP.
                 */
                accessor.setUser(
                        authentication
                );


            } catch (
                    RuntimeException exception
            ) {

                throw new AccessDeniedException(

                        "No fue posible autenticar la conexión WebSocket",

                        exception
                );
            }
        }


        return message;
    }
}