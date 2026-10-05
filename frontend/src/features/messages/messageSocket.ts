import {
    Client
} from "@stomp/stompjs";

import {
    getToken
} from "../../auth/authStorage";

import type {
    DevMessage
} from "./messageTypes";


const WS_URL =
    import.meta.env.VITE_WS_URL
    ??
    "ws://localhost:8080/ws";


export function createMessageSocket(

    channelId: string,

    onMessage:
        (message: DevMessage) => void,

    onConnectionChange:
        (connected: boolean) => void

): Client {

    const token =
        getToken();


    const client =
        new Client({

            brokerURL:
                WS_URL,

            connectHeaders:
                token
                    ? {
                        Authorization:
                            `Bearer ${token}`
                    }
                    : {},

            reconnectDelay:
                5000,

            heartbeatIncoming:
                10000,

            heartbeatOutgoing:
                10000
        });


    client.onConnect = () => {

        onConnectionChange(
            true
        );


        client.subscribe(

            `/topic/channels/${channelId}`,

            frame => {

                const message =
                    JSON.parse(
                        frame.body
                    ) as DevMessage;


                onMessage(
                    message
                );
            }
        );
    };


    client.onDisconnect = () => {

        onConnectionChange(
            false
        );
    };


    client.onWebSocketClose = () => {

        onConnectionChange(
            false
        );
    };


    client.onStompError =
        frame => {

            console.error(
                "Error STOMP:",
                frame.headers,
                frame.body
            );
        };


    return client;
}


export function publishMessage(

    client: Client,

    serverId: string,

    channelId: string,

    content: string
) {

    client.publish({

        destination:
            `/app/servers/${serverId}/channels/${channelId}/messages`,

        body:
            JSON.stringify({
                content
            })
    });
}