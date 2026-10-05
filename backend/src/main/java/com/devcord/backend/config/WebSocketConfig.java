package com.devcord.backend.config;

import com.devcord.backend.auth.security.JwtStompAuthenticationInterceptor;

import org.springframework.context.annotation.Configuration;

import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;

import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig
        implements WebSocketMessageBrokerConfigurer {

    private final JwtStompAuthenticationInterceptor
            jwtStompAuthenticationInterceptor;


    public WebSocketConfig(

            JwtStompAuthenticationInterceptor
                    jwtStompAuthenticationInterceptor
    ) {

        this.jwtStompAuthenticationInterceptor =
                jwtStompAuthenticationInterceptor;
    }


    @Override
    public void registerStompEndpoints(
            StompEndpointRegistry registry
    ) {

        registry
                .addEndpoint("/ws")

                .setAllowedOrigins(
                        "http://localhost:5173"
                );
    }


    @Override
    public void configureMessageBroker(
            MessageBrokerRegistry registry
    ) {

        /*
         * Mensajes enviados desde React:
         *
         * /app/...
         */
        registry
                .setApplicationDestinationPrefixes(
                        "/app"
                );


        /*
         * Mensajes publicados desde Spring:
         *
         * /topic/...
         */
        registry
                .enableSimpleBroker(
                        "/topic"
                );
    }


    @Override
    public void configureClientInboundChannel(
            ChannelRegistration registration
    ) {

        registration.interceptors(
                jwtStompAuthenticationInterceptor
        );
    }
}