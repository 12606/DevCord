
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Client } from "@stomp/stompjs";

import { getCurrentUser } from "../api/api";
import type { User } from "../api/api";

import { clearToken } from "../auth/authStorage";

import {
    createServer,
    getServers
} from "../features/servers/serverApi";
import type { DevServer } from "../features/servers/serverTypes";

import {
    createChannel,
    deleteChannel,
    getChannels
} from "../features/channels/channelApi";
import type { DevChannel } from "../features/channels/channelTypes";

import { getMessages } from "../features/messages/messageApi";

import {
    createMessageSocket,
    publishMessage
} from "../features/messages/messageSocket";
import type { DevMessage } from "../features/messages/messageTypes";

/*
 * Combina mensajes de diferentes fuentes sin repetir sus IDs.
 * También los ordena por fecha para que el chat conserve su orden.
 */
function mergeMessages(
    ...collections: DevMessage[][]
): DevMessage[] {
    const messagesById = new Map<string, DevMessage>();

    for (const collection of collections) {
        for (const message of collection) {
            messagesById.set(message.id, message);
        }
    }

    return Array.from(messagesById.values()).sort(
        (a, b) => {
            const timeA = Date.parse(a.createdAt);
            const timeB = Date.parse(b.createdAt);

            return (
                (Number.isNaN(timeA) ? 0 : timeA) -
                (Number.isNaN(timeB) ? 0 : timeB)
            );
        }
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);

    const [servers, setServers] = useState<DevServer[]>([]);
    const [selectedServer, setSelectedServer] =
        useState<DevServer | null>(null);

    const [channels, setChannels] = useState<DevChannel[]>([]);
    const [selectedChannel, setSelectedChannel] =
        useState<DevChannel | null>(null);

    const [messages, setMessages] = useState<DevMessage[]>([]);
    const [messageText, setMessageText] = useState("");

    const [socketConnected, setSocketConnected] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [channelsLoading, setChannelsLoading] = useState(false);

    const socketRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const [showCreateServer, setShowCreateServer] = useState(false);
    const [serverName, setServerName] = useState("");
    const [serverDescription, setServerDescription] = useState("");
    const [creatingServer, setCreatingServer] = useState(false);

    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [channelName, setChannelName] = useState("");
    const [creatingChannel, setCreatingChannel] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    /*
     * Inicialización:
     * 1. Comprueba la sesión actual.
     * 2. Obtiene el usuario.
     * 3. Carga los servidores disponibles.
     */
    useEffect(() => {
        let cancelled = false;

        async function initialize() {
            try {
                const currentUser = await getCurrentUser();

                if (cancelled) return;

                setUser(currentUser);
            } catch (err) {
                console.error("Sesión inválida:", err);

                if (!cancelled) {
                    clearToken();
                    navigate("/login");
                }

                return;
            }

            try {
                const serverList = await getServers();

                if (cancelled) return;

                setServers(serverList);

                if (serverList.length > 0) {
                    setSelectedServer(serverList[0]);
                }
            } catch (err) {
                console.error("Error cargando servidores:", err);

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "No fue posible cargar los servidores."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void initialize();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    /*
     * Cuando cambia el servidor, carga sus canales.
     * La bandera cancelled evita que una respuesta antigua
     * reemplace los canales del servidor seleccionado actualmente.
     */
    useEffect(() => {
        let cancelled = false;

        setChannels([]);
        setSelectedChannel(null);
        setError("");

        if (!selectedServer) {
            setChannelsLoading(false);

            return () => {
                cancelled = true;
            };
        }

        const serverId = selectedServer.id;

        async function loadChannels() {
            setChannelsLoading(true);

            try {
                const channelList = await getChannels(serverId);

                if (cancelled) return;

                setChannels(channelList);
                setSelectedChannel(channelList[0] ?? null);
            } catch (err) {
                console.error("Error cargando canales:", err);

                if (!cancelled) {
                    setChannels([]);
                    setSelectedChannel(null);
                    setError(
                        err instanceof Error
                            ? err.message
                            : "No fue posible cargar los canales."
                    );
                }
            } finally {
                if (!cancelled) {
                    setChannelsLoading(false);
                }
            }
        }

        void loadChannels();

        return () => {
            cancelled = true;
        };
    }, [selectedServer]);

    /*
     * Cuando cambia el canal:
     * 1. Abre el WebSocket.
     * 2. Se suscribe a los mensajes del canal.
     * 3. Consulta el historial por REST.
     *
     * El historial y los mensajes en tiempo real se combinan
     * para evitar duplicados y pérdidas durante la carga.
     */
    useEffect(() => {
        if (!selectedServer || !selectedChannel) {
            setMessages([]);
            setMessagesLoading(false);
            setSocketConnected(false);
            return;
        }

        let cancelled = false;

        const serverId = selectedServer.id;
        const channelId = selectedChannel.id;

        setMessages([]);
        setMessagesLoading(true);
        setSocketConnected(false);
        setMessageText("");
        setError("");

        const client = createMessageSocket(
            channelId,
            (message) => {
                if (cancelled) return;

                setMessages((current) =>
                    mergeMessages(current, [message])
                );
            },
            (connected) => {
                if (!cancelled) {
                    setSocketConnected(connected);
                }
            }
        );

        socketRef.current = client;
        client.activate();

        async function loadHistory() {
            try {
                const history = await getMessages(
                    serverId,
                    channelId
                );

                if (cancelled) return;

                setMessages((current) =>
                    mergeMessages(history, current)
                );
            } catch (err) {
                console.error("Error cargando el historial:", err);

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "No fue posible cargar los mensajes."
                    );
                }
            } finally {
                if (!cancelled) {
                    setMessagesLoading(false);
                }
            }
        }

        void loadHistory();

        return () => {
            cancelled = true;

            void client.deactivate();

            if (socketRef.current === client) {
                socketRef.current = null;
            }
        };
    }, [selectedServer, selectedChannel]);

    /*
     * Desplaza la conversación hacia el mensaje más reciente.
     */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    }, [messages]);

    /*
     * Selecciona un servidor y evita conservar el canal
     * anterior mientras se cargan los nuevos canales.
     */
    function handleSelectServer(server: DevServer) {
        setError("");

        if (selectedServer?.id !== server.id) {
            setSelectedChannel(null);
        }

        setSelectedServer(server);
    }

    async function handleCreateServer() {
        if (serverName.trim().length < 3) {
            setError(
                "El nombre del servidor debe tener al menos 3 caracteres."
            );
            return;
        }

        setCreatingServer(true);
        setError("");

        try {
            const server = await createServer({
                name: serverName.trim(),
                description: serverDescription.trim()
            });

            setServers((current) => [
                server,
                ...current.filter((item) => item.id !== server.id)
            ]);

            setSelectedChannel(null);
            setSelectedServer(server);

            setServerName("");
            setServerDescription("");
            setShowCreateServer(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible crear el servidor."
            );
        } finally {
            setCreatingServer(false);
        }
    }

    async function handleCreateChannel() {
        if (!selectedServer) return;

        if (!channelName.trim()) {
            setError("Escribe un nombre para el canal.");
            return;
        }

        setCreatingChannel(true);
        setError("");

        try {
            const channel = await createChannel(
                selectedServer.id,
                channelName.trim()
            );

            setChannels((current) => [
                ...current,
                channel
            ]);

            setSelectedChannel(channel);
            setChannelName("");
            setShowCreateChannel(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible crear el canal."
            );
        } finally {
            setCreatingChannel(false);
        }
    }

    async function handleDeleteChannel(channel: DevChannel) {
        if (!selectedServer) return;

        const confirmed = window.confirm(
            `¿Eliminar el canal #${channel.name}? Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        setError("");

        try {
            await deleteChannel(
                selectedServer.id,
                channel.id
            );

            const remaining = channels.filter(
                (item) => item.id !== channel.id
            );

            setChannels(remaining);

            if (selectedChannel?.id === channel.id) {
                setSelectedChannel(remaining[0] ?? null);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible eliminar el canal."
            );
        }
    }

    /*
     * El servidor guarda el mensaje y lo distribuye por WebSocket.
     * El frontend espera la respuesta del servidor para mostrarlo.
     */
    function handleSendMessage(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!selectedServer || !selectedChannel) return;

        const content = messageText.trim();

        if (!content) return;

        if (!socketRef.current || !socketConnected) {
            setError(
                "El chat todavía no está conectado. Inténtalo de nuevo en unos segundos."
            );
            return;
        }

        try {
            publishMessage(
                socketRef.current,
                selectedServer.id,
                selectedChannel.id,
                content
            );

            setMessageText("");
            setError("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible enviar el mensaje."
            );
        }
    }

    const canManageChannels =
        selectedServer?.currentUserRole === "OWNER" ||
        selectedServer?.currentUserRole === "ADMIN";

    function logout() {
        if (socketRef.current) {
            void socketRef.current.deactivate();
            socketRef.current = null;
        }

        clearToken();
        navigate("/login");
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-content">
                    <div className="loading-logo">DC</div>
                    <div className="loading-spinner" />
                    <p>Cargando tu espacio de trabajo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            {/* BARRA DE SERVIDORES */}
            <aside className="server-rail">
                <button
                    type="button"
                    className={`server-icon home-server ${
                        !selectedServer ? "active" : ""
                    }`}
                    title="Inicio de DevCord"
                    aria-label="Ir al inicio"
                    onClick={() => {
                        setError("");
                        setSelectedChannel(null);
                        setSelectedServer(null);
                    }}
                >
                    <span>DC</span>
                </button>

                <div className="server-divider" />

                <div className="server-list">
                    {servers.map((server) => (
                        <button
                            type="button"
                            key={server.id}
                            className={`server-icon ${
                                selectedServer?.id === server.id
                                    ? "active"
                                    : ""
                            }`}
                            title={server.name}
                            aria-label={`Seleccionar ${server.name}`}
                            aria-pressed={
                                selectedServer?.id === server.id
                            }
                            onClick={() => handleSelectServer(server)}
                        >
                            {server.name.charAt(0).toUpperCase()}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    className="server-icon add-server"
                    title="Crear servidor"
                    aria-label="Crear servidor"
                    onClick={() => {
                        setError("");
                        setShowCreateServer(true);
                    }}
                >
                    +
                </button>
            </aside>

            {/* PANEL DE CANALES */}
            <aside className="channel-panel">
                <header className="server-header">
                    <div className="server-header-copy">
                        <span className="server-kicker">
                            ESPACIO DE TRABAJO
                        </span>

                        <h1 className="server-title">
                            {selectedServer
                                ? selectedServer.name
                                : "DevCord"}
                        </h1>
                    </div>

                    {selectedServer?.currentUserRole && (
                        <span className="role-badge">
                            {selectedServer.currentUserRole}
                        </span>
                    )}
                </header>

                <div className="channel-section">
                    <div className="channel-section-header">
                        <span>CANALES DE TEXTO</span>

                        {canManageChannels && (
                            <button
                                type="button"
                                title="Crear canal"
                                aria-label="Crear canal"
                                onClick={() => {
                                    setError("");
                                    setShowCreateChannel(true);
                                }}
                            >
                                +
                            </button>
                        )}
                    </div>

                    <div className="channel-list">
                        {!selectedServer ? (
                            <p className="no-channels">
                                Selecciona un servidor para ver sus canales.
                            </p>
                        ) : channelsLoading ? (
                            <p className="no-channels">
                                Cargando canales...
                            </p>
                        ) : channels.length === 0 ? (
                            <p className="no-channels">
                                No hay canales todavía.
                            </p>
                        ) : (
                            channels.map((channel) => (
                                <div
                                    key={channel.id}
                                    className={`channel-row ${
                                        selectedChannel?.id === channel.id
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    <button
                                        type="button"
                                        className="channel-button"
                                        aria-pressed={
                                            selectedChannel?.id === channel.id
                                        }
                                        onClick={() => {
                                            setError("");
                                            setSelectedChannel(channel);
                                        }}
                                    >
                                        <span className="channel-hash">
                                            #
                                        </span>
                                        <span className="channel-name">
                                            {channel.name}
                                        </span>
                                    </button>

                                    {canManageChannels && (
                                        <button
                                            type="button"
                                            className="delete-channel-button"
                                            title={`Eliminar ${channel.name}`}
                                            aria-label={`Eliminar canal ${channel.name}`}
                                            onClick={() =>
                                                void handleDeleteChannel(channel)
                                            }
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* USUARIO ACTUAL */}
                <footer className="current-user">
                    <div className="avatar">
                        {user?.username?.charAt(0).toUpperCase() ?? "U"}
                    </div>

                    <div className="current-user-info">
                        <strong>{user?.username ?? "Usuario"}</strong>
                        <span>{user?.email ?? ""}</span>
                    </div>

                    <span
                        className="user-status-dot"
                        title="Sesión activa"
                    />

                    <button
                        type="button"
                        onClick={logout}
                        className="logout-icon"
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                    >
                        ↪
                    </button>
                </footer>
            </aside>

            {/* ÁREA PRINCIPAL */}
            <main className="main-panel">
                {error &&
                    !selectedChannel &&
                    !showCreateServer &&
                    !showCreateChannel && (
                        <div className="main-error" role="alert">
                            {error}
                        </div>
                    )}

                {!selectedServer ? (
                    <section className="empty-server-state">
                        <div className="empty-state-icon">DC</div>
                        <span className="empty-state-eyebrow">
                            TU ESPACIO DE TRABAJO
                        </span>

                        <h2>Bienvenido a DevCord</h2>

                        <p>
                            Crea un servidor para organizar tus conversaciones
                            y comenzar a comunicarte con tu equipo.
                        </p>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                                setError("");
                                setShowCreateServer(true);
                            }}
                        >
                            <span>+</span> Crear servidor
                        </button>
                    </section>
                ) : !selectedChannel ? (
                    <section className="empty-server-state">
                        <div className="empty-state-icon">#</div>
                        <span className="empty-state-eyebrow">
                            {selectedServer.name}
                        </span>

                        <h2>
                            {channelsLoading
                                ? "Cargando canales..."
                                : "Todavía no hay una conversación"}
                        </h2>

                        <p>
                            {channelsLoading
                                ? "Estamos preparando los canales de este servidor."
                                : canManageChannels
                                    ? "Crea un canal de texto para que los miembros puedan comenzar a conversar."
                                    : "Este servidor aún no tiene canales disponibles. Pide a un administrador que cree uno."}
                        </p>

                        {!channelsLoading && canManageChannels && (
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => {
                                    setError("");
                                    setShowCreateChannel(true);
                                }}
                            >
                                <span>+</span> Crear canal
                            </button>
                        )}
                    </section>
                ) : (
                    <div className="chat-layout">
                        {/* ENCABEZADO DEL CHAT */}
                        <header className="main-header">
                            <div className="channel-heading">
                                <span className="channel-heading-hash">
                                    #
                                </span>

                                <div>
                                    <h2>{selectedChannel.name}</h2>
                                    <p>
                                        Canal de texto ·{" "}
                                        {selectedServer.name}
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`socket-status ${
                                    socketConnected ? "connected" : ""
                                }`}
                                role="status"
                            >
                                <span className="socket-status-dot" />

                                {socketConnected
                                    ? "Conectado"
                                    : "Conectando"}
                            </div>
                        </header>

                        {/* MENSAJES */}
                        <div
                            className="message-list"
                            role="log"
                            aria-label={`Mensajes de ${selectedChannel.name}`}
                            aria-live="polite"
                            aria-relevant="additions"
                        >
                            {messagesLoading && messages.length === 0 ? (
                                <div className="message-loading">
                                    <div className="loading-spinner" />
                                    <span>Cargando historial de mensajes...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="channel-start">
                                    <div className="channel-symbol">#</div>

                                    <h2>
                                        Bienvenido a #{selectedChannel.name}
                                    </h2>

                                    <p>
                                        Este es el comienzo del canal. Envía el
                                        primer mensaje para iniciar la
                                        conversación.
                                    </p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <article
                                        key={message.id}
                                        className={`message-row ${
                                            message.authorId === user?.id
                                                ? "own-message"
                                                : ""
                                        }`}
                                    >
                                        <div
                                            className="message-avatar"
                                            aria-hidden="true"
                                        >
                                            {message.authorUsername
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="message-body">
                                            <div className="message-header">
                                                <strong>
                                                    {message.authorUsername}
                                                </strong>

                                                <time
                                                    dateTime={message.createdAt}
                                                >
                                                    {new Date(
                                                        message.createdAt
                                                    ).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        }
                                                    )}
                                                </time>
                                            </div>

                                            <div className="message-content">
                                                {message.content}
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* COMPOSITOR DE MENSAJES */}
                        <div className="message-composer">
                            {error && (
                                <div className="chat-error" role="alert">
                                    {error}
                                </div>
                            )}

                            <form
                                className="composer-form"
                                onSubmit={handleSendMessage}
                            >
                                <input
                                    value={messageText}
                                    maxLength={2000}
                                    aria-label="Escribir un mensaje"
                                    placeholder={`Enviar mensaje a #${selectedChannel.name}`}
                                    onChange={(event) =>
                                        setMessageText(event.target.value)
                                    }
                                />

                                <button
                                    type="submit"
                                    className="send-button"
                                    disabled={
                                        !socketConnected ||
                                        !messageText.trim()
                                    }
                                >
                                    Enviar
                                    <span aria-hidden="true">↑</span>
                                </button>
                            </form>

                            <p className="composer-hint">
                                Pulsa Enter para enviar · Máximo 2000 caracteres
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL: CREAR SERVIDOR */}
            {showCreateServer && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowCreateServer(false);
                            setError("");
                        }
                    }}
                >
                    <section
                        className="modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-server-title"
                    >
                        <div className="modal-heading">
                            <div>
                                <span className="modal-kicker">
                                    CONFIGURACIÓN
                                </span>
                                <h2 id="create-server-title">
                                    Crear servidor
                                </h2>
                                <p>
                                    Prepara un nuevo espacio para tus
                                    conversaciones.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                aria-label="Cerrar ventana"
                                onClick={() => {
                                    setShowCreateServer(false);
                                    setError("");
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="modal-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleCreateServer();
                            }}
                        >
                            <label htmlFor="server-name">
                                Nombre del servidor
                            </label>

                            <input
                                id="server-name"
                                value={serverName}
                                minLength={3}
                                maxLength={80}
                                autoFocus
                                required
                                placeholder="Ej. Equipo de desarrollo"
                                onChange={(event) =>
                                    setServerName(event.target.value)
                                }
                            />

                            <label htmlFor="server-description">
                                Descripción
                                <span className="optional-label">
                                    Opcional
                                </span>
                            </label>

                            <textarea
                                id="server-description"
                                value={serverDescription}
                                maxLength={500}
                                rows={3}
                                placeholder="¿Para qué se utilizará este servidor?"
                                onChange={(event) =>
                                    setServerDescription(event.target.value)
                                }
                            />

                            {error && (
                                <div className="error" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    disabled={creatingServer}
                                    onClick={() => {
                                        setShowCreateServer(false);
                                        setError("");
                                    }}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={
                                        creatingServer ||
                                        serverName.trim().length < 3
                                    }
                                >
                                    {creatingServer
                                        ? "Creando..."
                                        : "Crear servidor"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* MODAL: CREAR CANAL */}
            {showCreateChannel && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowCreateChannel(false);
                            setError("");
                        }
                    }}
                >
                    <section
                        className="modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-channel-title"
                    >
                        <div className="modal-heading">
                            <div>
                                <span className="modal-kicker">
                                    {selectedServer?.name ?? "SERVIDOR"}
                                </span>
                                <h2 id="create-channel-title">
                                    Crear canal
                                </h2>
                                <p>
                                    Crea una conversación para un tema
                                    específico.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                aria-label="Cerrar ventana"
                                onClick={() => {
                                    setShowCreateChannel(false);
                                    setError("");
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="modal-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleCreateChannel();
                            }}
                        >
                            <label htmlFor="channel-name">
                                Nombre del canal
                            </label>

                            <div className="channel-name-input">
                                <span>#</span>
                                <input
                                    id="channel-name"
                                    value={channelName}
                                    maxLength={80}
                                    required
                                    autoFocus
                                    placeholder="general"
                                    onChange={(event) =>
                                        setChannelName(event.target.value)
                                    }
                                />
                            </div>

                            <p className="field-hint">
                                Utiliza un nombre corto y fácil de reconocer.
                            </p>

                            {error && (
                                <div className="error" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    disabled={creatingChannel}
                                    onClick={() => {
                                        setShowCreateChannel(false);
                                        setChannelName("");
                                        setError("");
                                    }}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={
                                        creatingChannel ||
                                        !channelName.trim()
                                    }
                                >
                                    {creatingChannel
                                        ? "Creando..."
                                        : "Crear canal"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
