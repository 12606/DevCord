import {
    request
} from "../../api/api";

import type {
    DevMessage
} from "./messageTypes";


export function getMessages(
    serverId: string,
    channelId: string
) {

    return request<DevMessage[]>(

        `/servers/${serverId}/channels/${channelId}/messages?limit=50`
    );
}