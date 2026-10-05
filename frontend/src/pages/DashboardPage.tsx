import {
    useEffect,
    useRef,
    useState
} from "react";

import type {
    FormEvent
} from "react";

import {
    useNavigate
} from "react-router-dom";

import type {
    Client
} from "@stomp/stompjs";

import {
    getCurrentUser
} from "../api/api";

import type {
    User
} from "../api/api";

import {
    clearToken
} from "../auth/authStorage";

import {
    createServer,
    getServers
} from "../features/servers/serverApi";

import type {
    DevServer
} from "../features/servers/serverTypes";

import {
    createChannel,
    deleteChannel,
    getChannels
} from "../features/channels/channelApi";

import type {
    DevChannel
} from "../features/channels/channelTypes";

import {
    getMessages
} from "../features/messages/messageApi";

import {
    createMessageSocket,
    publishMessage
} from "../features/messages/messageSocket";

import type {
    DevMessage
} from "../features/messages/messageTypes";


export default function DashboardPage() {

    const navigate =
        useNavigate();


    const [user, setUser] =
        useState<User | null>(null);


    const [servers, setServers] =
        useState<DevServer[]>([]);


    const [
        selectedServer,
        setSelectedServer
    ] =
        useState<DevServer | null>(
            null
        );


    const [channels, setChannels] =
        useState<DevChannel[]>([]);


    const [
        selectedChannel,
        setSelectedChannel
    ] =
        useState<DevChannel | null>(
            null
        );


    const [messages, setMessages] =
        useState<DevMessage[]>([]);


    const [
        messageText,
        setMessageText
    ] =
        useState("");


    const [
        socketConnected,
        setSocketConnected
    ] =
        useState(false);


    const socketRef =
        useRef<Client | null>(
            null
        );


    const messagesEndRef =
        useRef<HTMLDivElement | null>(
            null
        );


    const [
        showCreateServer,
        setShowCreateServer
    ] =
        useState(false);


    const [
        serverName,
        setServerName
    ] =
        useState("");


    const [
        serverDescription,
        setServerDescription
    ] =
        useState("");


    const [
        showCreateChannel,
        setShowCreateChannel
    ] =
        useState(false);


    const [
        channelName,
        setChannelName
    ] =
        useState("");


    const [error, setError] =
        useState("");


    const [loading, setLoading] =
        useState(true);


    /*
     * Inicialización:
     *
     * 1. Validar sesión.
     * 2. Obtener servidores.
     */
    useEffect(() => {

        async function initialize() {

            try {

                const currentUser =
                    await getCurrentUser();


                setUser(
                    currentUser
                );

            } catch (error) {

                console.error(
                    "Sesión inválida:",
                    error
                );


                clearToken();

                navigate(
                    "/login"
                );

                return;
            }


            try {

                const serverList =
                    await getServers();


                setServers(
                    serverList
                );


                if (
                    serverList.length > 0
                ) {

                    setSelectedServer(
                        serverList[0]
                    );
                }

            } catch (error) {

                console.error(
                    "Error cargando servidores:",
                    error
                );


                if (
                    error instanceof Error
                ) {

                    setError(
                        error.message
                    );
                }

            } finally {

                setLoading(false);
            }
        }


        initialize();

    }, [navigate]);


    /*
     * Cuando cambia el servidor,
     * obtenemos sus canales.
     */
    useEffect(() => {

        async function loadChannels() {

            if (!selectedServer) {

                setChannels([]);

                setSelectedChannel(
                    null
                );

                return;
            }


            try {

                const channelList =
                    await getChannels(
                        selectedServer.id
                    );


                setChannels(
                    channelList
                );


                setSelectedChannel(
                    channelList[0]
                    ?? null
                );

            } catch (error) {

                console.error(
                    "Error cargando canales:",
                    error
                );


                setChannels([]);

                setSelectedChannel(
                    null
                );
            }
        }


        loadChannels();

    }, [selectedServer]);


    /*
     * Cuando cambia el canal:
     *
     * 1. Carga historial REST.
     * 2. Abre conexión WebSocket.
     * 3. Se suscribe al canal.
     */
    useEffect(() => {

        if (
            !selectedServer
            ||
            !selectedChannel
        ) {

            setMessages([]);

            setSocketConnected(
                false
            );

            return;
        }


        let cancelled =
            false;


        async function initializeMessages() {

            try {

                const history =
                    await getMessages(

                        selectedServer!.id,

                        selectedChannel!.id
                    );


                if (!cancelled) {

                    setMessages(
                        history
                    );
                }

            } catch (error) {

                console.error(
                    "Error cargando mensajes:",
                    error
                );
            }
        }


        initializeMessages();


        /*
         * Si existía un socket anterior
         * lo cerramos.
         */
        if (socketRef.current) {

            socketRef.current
                    .deactivate();

            socketRef.current =
                null;
        }


        const client =
            createMessageSocket(

                selectedChannel.id,

                message => {

                    setMessages(
                        current => {

                            /*
                             * Evitamos mensajes
                             * duplicados.
                             */
                            if (
                                current.some(
                                    item =>
                                        item.id
                                        === message.id
                                )
                            ) {

                                return current;
                            }


                            return [
                                ...current,
                                message
                            ];
                        }
                    );
                },

                connected => {

                    setSocketConnected(
                        connected
                    );
                }
            );


        socketRef.current =
            client;


        client.activate();


        return () => {

            cancelled =
                true;


            client.deactivate();


            if (
                socketRef.current
                === client
            ) {

                socketRef.current =
                    null;
            }


            setSocketConnected(
                false
            );
        };

    }, [
        selectedServer,
        selectedChannel
    ]);


    /*
     * Hace scroll automático hacia
     * el último mensaje.
     */
    useEffect(() => {

        messagesEndRef.current
                ?.scrollIntoView({
                    behavior: "smooth"
                });

    }, [messages]);


    async function handleCreateServer() {

        if (
            serverName
                .trim()
                .length < 3
        ) {

            setError(
                "El nombre debe tener al menos 3 caracteres."
            );

            return;
        }


        try {

            setError("");


            const server =
                await createServer({

                    name:
                        serverName.trim(),

                    description:
                        serverDescription.trim()
                });


            setServers(
                current => [
                    server,
                    ...current
                ]
            );


            setSelectedServer(
                server
            );


            setServerName("");

            setServerDescription("");

            setShowCreateServer(
                false
            );

        } catch (error) {

            if (
                error instanceof Error
            ) {

                setError(
                    error.message
                );
            }
        }
    }


    async function handleCreateChannel() {

        if (!selectedServer) {
            return;
        }


        if (!channelName.trim()) {

            setError(
                "Escribe un nombre para el canal."
            );

            return;
        }


        try {

            setError("");


            const channel =
                await createChannel(

                    selectedServer.id,

                    channelName.trim()
                );


            setChannels(
                current => [
                    ...current,
                    channel
                ]
            );


            setSelectedChannel(
                channel
            );


            setChannelName("");

            setShowCreateChannel(
                false
            );

        } catch (error) {

            if (
                error instanceof Error
            ) {

                setError(
                    error.message
                );
            }
        }
    }


    async function handleDeleteChannel(
        channel: DevChannel
    ) {

        if (!selectedServer) {
            return;
        }


        const confirmed =
            window.confirm(

                `¿Eliminar el canal #${channel.name}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            await deleteChannel(

                selectedServer.id,

                channel.id
            );


            const remaining =
                channels.filter(

                    current =>
                        current.id
                        !== channel.id
                );


            setChannels(
                remaining
            );


            if (
                selectedChannel?.id
                === channel.id
            ) {

                setSelectedChannel(
                    remaining[0]
                    ?? null
                );
            }

        } catch (error) {

            if (
                error instanceof Error
            ) {

                setError(
                    error.message
                );
            }
        }
    }


    /*
     * Envía el mensaje mediante STOMP.
     */
    function handleSendMessage(
        event: FormEvent
    ) {

        event.preventDefault();


        if (
            !selectedServer
            ||
            !selectedChannel
        ) {
            return;
        }


        const content =
            messageText.trim();


        if (!content) {
            return;
        }


        if (
            !socketRef.current
            ||
            !socketConnected
        ) {

            setError(
                "La conexión de chat todavía no está disponible."
            );

            return;
        }


        publishMessage(

            socketRef.current,

            selectedServer.id,

            selectedChannel.id,

            content
        );


        /*
         * No agregamos el mensaje
         * manualmente al estado.
         *
         * Esperamos que el servidor lo
         * guarde y lo devuelva mediante
         * WebSocket.
         */
        setMessageText("");

        setError("");
    }


    const canManageChannels =

        selectedServer
            ?.currentUserRole
            === "OWNER"

        ||

        selectedServer
            ?.currentUserRole
            === "ADMIN";


    function logout() {

        socketRef.current
                ?.deactivate();


        clearToken();


        navigate(
            "/login"
        );
    }


    if (loading) {

        return (
            <div className="loading">

                Cargando DevCord...

            </div>
        );
    }


    return (

        <div className="app-shell">


            {/* SERVIDORES */}

            <aside className="server-rail">


                <button
                    className="server-icon home-server"
                    title="Inicio"
                >
                    DC
                </button>


                <div className="server-divider" />


                {servers.map(
                    server => (

                        <button

                            key={server.id}

                            className={
                                selectedServer?.id
                                === server.id

                                    ? "server-icon active"

                                    : "server-icon"
                            }

                            title={
                                server.name
                            }

                            onClick={() => {

                                setError("");

                                setSelectedServer(
                                    server
                                );
                            }}
                        >

                            {server.name
                                .charAt(0)
                                .toUpperCase()
                            }

                        </button>
                    )
                )}


                <button

                    className="server-icon add-server"

                    title="Crear servidor"

                    onClick={() => {

                        setError("");

                        setShowCreateServer(
                            true
                        );
                    }}
                >
                    +
                </button>


            </aside>



            {/* CANALES */}

            <aside className="channel-panel">


                <div className="server-header">

                    {selectedServer
                        ? selectedServer.name
                        : "DevCord"
                    }

                </div>


                <div className="channel-section">


                    <div className="channel-section-header">

                        <span>
                            CANALES DE TEXTO
                        </span>


                        {canManageChannels && (

                            <button

                                title="Crear canal"

                                onClick={() => {

                                    setError("");

                                    setShowCreateChannel(
                                        true
                                    );
                                }}
                            >
                                +
                            </button>
                        )}

                    </div>


                    <div className="channel-list">

                        {channels.length === 0 ? (

                            <p className="no-channels">
                                No hay canales todavía.
                            </p>

                        ) : (

                            channels.map(
                                channel => (

                                    <div

                                        key={
                                            channel.id
                                        }

                                        className={
                                            selectedChannel?.id
                                            === channel.id

                                                ? "channel-row active"

                                                : "channel-row"
                                        }
                                    >


                                        <button

                                            className="channel-button"

                                            onClick={() =>
                                                setSelectedChannel(
                                                    channel
                                                )
                                            }
                                        >

                                            <span>#</span>

                                            {channel.name}

                                        </button>


                                        {canManageChannels && (

                                            <button

                                                className="delete-channel-button"

                                                title="Eliminar canal"

                                                onClick={() =>
                                                    handleDeleteChannel(
                                                        channel
                                                    )
                                                }
                                            >
                                                ×
                                            </button>
                                        )}

                                    </div>
                                )
                            )
                        )}

                    </div>


                </div>



                {/* USUARIO */}

                <div className="current-user">


                    <div className="avatar">

                        {user?.username
                            .charAt(0)
                            .toUpperCase()
                        }

                    </div>


                    <div className="current-user-info">

                        <strong>
                            {user?.username}
                        </strong>

                        <span>
                            {user?.email}
                        </span>

                    </div>


                    <button

                        onClick={
                            logout
                        }

                        className="logout-icon"

                        title="Cerrar sesión"
                    >
                        ↪
                    </button>


                </div>


            </aside>



            {/* CHAT */}

            <main className="main-panel">


                {!selectedServer ? (

                    <section className="empty-server-state">

                        <h1>
                            Bienvenido a DevCord
                        </h1>

                        <p>
                            Crea tu primer servidor.
                        </p>

                    </section>


                ) : !selectedChannel ? (

                    <section className="empty-server-state">

                        <h1>
                            {selectedServer.name}
                        </h1>

                        <p>
                            Crea o selecciona un canal.
                        </p>

                    </section>


                ) : (

                    <div className="chat-layout">


                        <header className="main-header">


                            <div>

                                <h2>
                                    # {selectedChannel.name}
                                </h2>

                                <span>

                                    {socketConnected
                                        ? "Chat conectado"
                                        : "Conectando..."
                                    }

                                </span>

                            </div>


                            <span
                                className={
                                    socketConnected
                                        ? "socket-status connected"
                                        : "socket-status"
                                }
                            >

                                {socketConnected
                                    ? "● Online"
                                    : "○ Offline"
                                }

                            </span>


                        </header>



                        <div className="message-list">


                            {messages.length === 0 && (

                                <div className="channel-start">

                                    <div className="channel-symbol">
                                        #
                                    </div>

                                    <h1>
                                        Bienvenido a #{selectedChannel.name}
                                    </h1>

                                    <p>
                                        Este es el comienzo del canal.
                                    </p>

                                </div>
                            )}


                            {messages.map(
                                message => (

                                    <div

                                        key={
                                            message.id
                                        }

                                        className={
                                            message.authorId
                                            === user?.id

                                                ? "message-row own-message"

                                                : "message-row"
                                        }
                                    >


                                        <div className="message-avatar">

                                            {message
                                                .authorUsername
                                                .charAt(0)
                                                .toUpperCase()
                                            }

                                        </div>


                                        <div className="message-body">


                                            <div className="message-header">

                                                <strong>
                                                    {message.authorUsername}
                                                </strong>


                                                <span>

                                                    {new Date(
                                                        message.createdAt
                                                    ).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour:
                                                                "2-digit",

                                                            minute:
                                                                "2-digit"
                                                        }
                                                    )}

                                                </span>

                                            </div>


                                            <div className="message-content">

                                                {message.content}

                                            </div>


                                        </div>


                                    </div>
                                )
                            )}


                            <div
                                ref={
                                    messagesEndRef
                                }
                            />


                        </div>



                        <div className="message-composer">


                            {error && (

                                <div className="chat-error">
                                    {error}
                                </div>
                            )}


                            <form
                                onSubmit={
                                    handleSendMessage
                                }
                            >

                                <input

                                    value={
                                        messageText
                                    }

                                    maxLength={
                                        2000
                                    }

                                    placeholder={
                                        `Enviar mensaje a #${selectedChannel.name}`
                                    }

                                    onChange={
                                        event =>
                                            setMessageText(
                                                event
                                                    .target
                                                    .value
                                            )
                                    }
                                />


                                <button
                                    type="submit"

                                    disabled={
                                        !socketConnected
                                        ||
                                        !messageText.trim()
                                    }
                                >
                                    Enviar
                                </button>


                            </form>


                        </div>


                    </div>
                )}


            </main>



            {/* MODAL SERVIDOR */}

            {showCreateServer && (

                <div className="modal-backdrop">

                    <div className="modal-card">

                        <h2>
                            Crear servidor
                        </h2>


                        <label>
                            Nombre
                        </label>


                        <input

                            value={
                                serverName
                            }

                            maxLength={80}

                            onChange={
                                event =>
                                    setServerName(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        />


                        <label>
                            Descripción
                        </label>


                        <textarea

                            value={
                                serverDescription
                            }

                            maxLength={500}

                            onChange={
                                event =>
                                    setServerDescription(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        />


                        {error && (

                            <div className="error">
                                {error}
                            </div>
                        )}


                        <div className="modal-actions">


                            <button

                                className="secondary-button"

                                onClick={() => {

                                    setShowCreateServer(
                                        false
                                    );

                                    setError("");
                                }}
                            >
                                Cancelar
                            </button>


                            <button
                                onClick={
                                    handleCreateServer
                                }
                            >
                                Crear servidor
                            </button>


                        </div>


                    </div>

                </div>
            )}



            {/* MODAL CANAL */}

            {showCreateChannel && (

                <div className="modal-backdrop">


                    <div className="modal-card">


                        <h2>
                            Crear canal
                        </h2>


                        <label>
                            Nombre del canal
                        </label>


                        <input

                            value={
                                channelName
                            }

                            maxLength={80}

                            placeholder="general"

                            onChange={
                                event =>
                                    setChannelName(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        />


                        {error && (

                            <div className="error">
                                {error}
                            </div>
                        )}


                        <div className="modal-actions">


                            <button

                                className="secondary-button"

                                onClick={() => {

                                    setShowCreateChannel(
                                        false
                                    );

                                    setChannelName("");

                                    setError("");
                                }}
                            >
                                Cancelar
                            </button>


                            <button
                                onClick={
                                    handleCreateChannel
                                }
                            >
                                Crear canal
                            </button>


                        </div>


                    </div>


                </div>
            )}


        </div>
    );
}