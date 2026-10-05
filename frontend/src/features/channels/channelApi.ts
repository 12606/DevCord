import {
    request
} from "../../api/api";

import type {
    DevChannel
} from "./channelTypes";


export function getChannels(
    serverId: string
) {

    return request<DevChannel[]>(
        `/servers/${serverId}/channels`
    );
}


export function createChannel(

    serverId: string,

    name: string
) {

    return request<DevChannel>(
        `/servers/${serverId}/channels`,
        {
            method: "POST",

            body: JSON.stringify({
                name
            })
        }
    );
}


export function updateChannel(

    serverId: string,

    channelId: string,

    name: string
) {

    return request<DevChannel>(
        `/servers/${serverId}/channels/${channelId}`,
        {
            method: "PATCH",

            body: JSON.stringify({
                name
            })
        }
    );
}


export function deleteChannel(

    serverId: string,

    channelId: string
) {

    return request<void>(
        `/servers/${serverId}/channels/${channelId}`,
        {
            method: "DELETE"
        }
    );
}