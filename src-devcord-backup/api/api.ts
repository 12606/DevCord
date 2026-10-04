import { getToken } from "../auth/authStorage";

const API_URL =
    import.meta.env.VITE_API_URL ??
    "http://localhost:8080/api";

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {

    const token = getToken();

    const headers = new Headers(options.headers);

    headers.set(
        "Content-Type",
        "application/json"
    );

    if (token) {
        headers.set(
            "Authorization",
            `Bearer ${token}`
        );
    }

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    const text =
        await response.text();

    let data: unknown = null;

    if (text) {
        data = JSON.parse(text);
    }

    if (!response.ok) {

        const error =
            data as {
                detail?: string;
                message?: string;
                error?: string;
            };

        throw new Error(
            error?.detail ??
            error?.message ??
            error?.error ??
            "Ocurrió un error"
        );
    }

    return data as T;
}

export function register(
    username: string,
    email: string,
    password: string
) {

    return request<AuthResponse>(
        "/auth/register",
        {
            method: "POST",
            body: JSON.stringify({
                username,
                email,
                password
            })
        }
    );
}

export function login(
    email: string,
    password: string
) {

    return request<AuthResponse>(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        }
    );
}

export function getCurrentUser() {

    return request<User>(
        "/users/me"
    );
}