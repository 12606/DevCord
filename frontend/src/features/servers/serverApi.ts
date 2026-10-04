import {
    request
} from "../../api/api";

import type {
    CreateServerPayload,
    DevServer,
    ServerMember
} from "./serverTypes";


export function getServers() {

    return request<DevServer[]>(
        "/servers"
    );
}


export function createServer(
    payload: CreateServerPayload
) {

    return request<DevServer>(
        "/servers",
        {
            method: "POST",

            body: JSON.stringify(
                payload
            )
        }
    );
}


export function getServerMembers(
    serverId: string
) {

    return request<ServerMember[]>(
        `/servers/${serverId}/members`
    );
}


export function addServerMember(

    serverId: string,

    username: string
) {

    return request<ServerMember>(
        `/servers/${serverId}/members`,
        {
            method: "POST",

            body: JSON.stringify({
                username
            })
        }
    );
}