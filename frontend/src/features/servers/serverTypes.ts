export interface DevServer {

    id: string;

    name: string;

    description: string | null;

    ownerId: string;

    ownerUsername: string;

    memberCount: number;

    currentUserRole:
        | "OWNER"
        | "ADMIN"
        | "MEMBER";

    createdAt: string;
}


export interface ServerMember {

    userId: string;

    username: string;

    role:
        | "OWNER"
        | "ADMIN"
        | "MEMBER";

    joinedAt: string;
}


export interface CreateServerPayload {

    name: string;

    description: string;
}