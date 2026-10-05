import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

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


export default function DashboardPage() {

    const navigate =
        useNavigate();


    /*
     * Usuario autenticado.
     */
    const [user, setUser] =
        useState<User | null>(null);


    /*
     * Servidores a los que pertenece el usuario.
     */
    const [servers, setServers] =
        useState<DevServer[]>([]);


    /*
     * Servidor actualmente seleccionado.
     */
    const [
        selectedServer,
        setSelectedServer
    ] =
        useState<DevServer | null>(
            null
        );


    /*
     * Controla el modal para crear servidores.
     */
    const [
        showCreateServer,
        setShowCreateServer
    ] =
        useState(false);


    /*
     * Campos del formulario para crear servidor.
     */
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


    /*
     * Canales pertenecientes al servidor seleccionado.
     */
    const [channels, setChannels] =
        useState<DevChannel[]>([]);


    /*
     * Canal actualmente seleccionado.
     */
    const [
        selectedChannel,
        setSelectedChannel
    ] =
        useState<DevChannel | null>(
            null
        );


    /*
     * Nombre utilizado al crear un canal.
     */
    const [
        channelName,
        setChannelName
    ] =
        useState("");


    /*
     * Controla el modal para crear canales.
     */
    const [
        showCreateChannel,
        setShowCreateChannel
    ] =
        useState(false);


    /*
     * Mensajes de error generales.
     */
    const [error, setError] =
        useState("");


    /*
     * Estado inicial de carga.
     */
    const [loading, setLoading] =
        useState(true);


    /*
     * Se ejecuta cuando entra el usuario al Dashboard.
     *
     * Primero comprueba que el JWT siga siendo válido.
     * Después obtiene los servidores del usuario.
     */
    useEffect(() => {

        async function initialize() {

            try {

                /*
                 * Comprobamos primero la sesión.
                 */
                const currentUser =
                    await getCurrentUser();


                setUser(
                    currentUser
                );

            } catch (error) {

                console.error(
                    "Error validando la sesión:",
                    error
                );


                /*
                 * Si /users/me falla significa que
                 * la sesión ya no es válida.
                 */
                clearToken();

                navigate(
                    "/login"
                );

                return;
            }


            try {

                /*
                 * Ahora obtenemos los servidores.
                 */
                const serverList =
                    await getServers();


                setServers(
                    serverList
                );


                /*
                 * Si existe al menos uno,
                 * seleccionamos automáticamente
                 * el primero.
                 */
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
     * Cada vez que cambia selectedServer,
     * cargamos automáticamente sus canales.
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


                /*
                 * Seleccionamos automáticamente
                 * el primer canal si existe.
                 */
                if (
                    channelList.length > 0
                ) {

                    setSelectedChannel(
                        channelList[0]
                    );

                } else {

                    setSelectedChannel(
                        null
                    );
                }

            } catch (error) {

                console.error(
                    "Error cargando canales:",
                    error
                );


                setChannels([]);

                setSelectedChannel(
                    null
                );


                if (
                    error instanceof Error
                ) {

                    setError(
                        error.message
                    );
                }
            }
        }


        loadChannels();

    }, [selectedServer]);


    /*
     * Crea un servidor.
     */
    async function handleCreateServer() {

        if (
            serverName.trim().length < 3
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


            /*
             * Agregamos el nuevo servidor
             * a la barra lateral.
             */
            setServers(
                current => [
                    server,
                    ...current
                ]
            );


            /*
             * Lo seleccionamos automáticamente.
             *
             * Esto también provocará que el useEffect
             * de canales consulte sus canales.
             */
            setSelectedServer(
                server
            );


            setServerName("");

            setServerDescription("");

            setShowCreateServer(
                false
            );

        } catch (error) {

            console.error(
                "Error creando servidor:",
                error
            );


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
     * Crea un canal dentro del servidor
     * actualmente seleccionado.
     */
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


            /*
             * Agregamos el canal nuevo
             * a la lista actual.
             */
            setChannels(
                current => [
                    ...current,
                    channel
                ]
            );


            /*
             * Seleccionamos automáticamente
             * el canal recién creado.
             */
            setSelectedChannel(
                channel
            );


            setChannelName("");

            setShowCreateChannel(
                false
            );

        } catch (error) {

            console.error(
                "Error creando canal:",
                error
            );


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
     * Elimina un canal.
     */
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

            setError("");


            await deleteChannel(

                selectedServer.id,

                channel.id
            );


            /*
             * Eliminamos el canal también
             * del estado local.
             */
            const remainingChannels =
                channels.filter(
                    item =>
                        item.id
                        !== channel.id
                );


            setChannels(
                remainingChannels
            );


            /*
             * Si eliminamos justamente el canal
             * que estaba seleccionado,
             * seleccionamos otro si existe.
             */
            if (
                selectedChannel?.id
                === channel.id
            ) {

                setSelectedChannel(
                    remainingChannels[0]
                    ?? null
                );
            }

        } catch (error) {

            console.error(
                "Error eliminando canal:",
                error
            );


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
     * OWNER y ADMIN pueden administrar canales.
     *
     * MEMBER únicamente puede visualizar.
     */
    const canManageChannels =

        selectedServer
            ?.currentUserRole === "OWNER"

        ||

        selectedServer
            ?.currentUserRole === "ADMIN";


    /*
     * Cierra la sesión eliminando el JWT.
     */
    function logout() {

        clearToken();

        navigate(
            "/login"
        );
    }


    /*
     * Pantalla mientras se valida
     * la sesión y cargan los datos.
     */
    if (loading) {

        return (
            <div className="loading">

                Cargando DevCord...

            </div>
        );
    }


    return (

        <div className="app-shell">


            {/* ========================= */}
            {/* BARRA DE SERVIDORES       */}
            {/* ========================= */}

            <aside className="server-rail">


                <button
                    className="server-icon home-server"
                    title="Inicio"
                >

                    DC

                </button>


                <div
                    className="server-divider"
                />


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



            {/* ========================= */}
            {/* PANEL DE CANALES          */}
            {/* ========================= */}

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


                        {!selectedServer ? (

                            <p className="no-channels">

                                Selecciona un servidor.

                            </p>

                        ) : channels.length === 0 ? (

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

                                            <span>
                                                #
                                            </span>

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



                {/* ========================= */}
                {/* USUARIO ACTUAL            */}
                {/* ========================= */}

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



            {/* ========================= */}
            {/* PANEL PRINCIPAL           */}
            {/* ========================= */}

            <main className="main-panel">


                {!selectedServer ? (

                    /*
                     * No existe ningún servidor.
                     */
                    <section className="empty-server-state">


                        <h1>

                            Bienvenido a DevCord

                        </h1>


                        <p>

                            Crea tu primer servidor
                            para comenzar.

                        </p>


                        <button

                            onClick={() => {

                                setError("");

                                setShowCreateServer(
                                    true
                                );
                            }}
                        >

                            Crear servidor

                        </button>


                    </section>


                ) : selectedChannel ? (

                    /*
                     * Existe servidor y existe
                     * un canal seleccionado.
                     */
                    <>


                        <header className="main-header">


                            <div>


                                <h2>

                                    # {selectedChannel.name}

                                </h2>


                                <span>

                                    Canal de texto

                                </span>


                            </div>


                            <span className="role-badge">

                                {
                                    selectedServer
                                        .currentUserRole
                                }

                            </span>


                        </header>


                        <section className="channel-content">


                            <div className="channel-symbol">

                                #

                            </div>


                            <h1>

                                Bienvenido a #
                                {selectedChannel.name}

                            </h1>


                            <p>

                                Este es el comienzo
                                del canal #
                                {selectedChannel.name}.

                            </p>


                            <div className="phase-message">

                                El canal ya está almacenado
                                en PostgreSQL.

                                <br />
                                <br />

                                La mensajería será
                                implementada en DevCord v0.4.

                            </div>


                        </section>


                    </>


                ) : (

                    /*
                     * Existe servidor, pero
                     * todavía no tiene canales.
                     */
                    <>


                        <header className="main-header">


                            <div>


                                <h2>

                                    {selectedServer.name}

                                </h2>


                                <span>

                                    {
                                        selectedServer
                                            .memberCount
                                    }{" "}

                                    miembro(s)

                                </span>


                            </div>


                            <span className="role-badge">

                                {
                                    selectedServer
                                        .currentUserRole
                                }

                            </span>


                        </header>


                        <section className="empty-server-state">


                            <div className="server-avatar-large">

                                {selectedServer
                                    .name
                                    .charAt(0)
                                    .toUpperCase()
                                }

                            </div>


                            <h1>

                                {selectedServer.name}

                            </h1>


                            <p>

                                {selectedServer.description
                                    ||
                                    "Este servidor todavía no tiene descripción."
                                }

                            </p>


                            <p>

                                Este servidor todavía
                                no tiene canales de texto.

                            </p>


                            {canManageChannels && (

                                <button

                                    onClick={() => {

                                        setError("");

                                        setShowCreateChannel(
                                            true
                                        );
                                    }}
                                >

                                    Crear primer canal

                                </button>
                            )}


                        </section>


                    </>
                )}


            </main>



            {/* ========================= */}
            {/* MODAL CREAR SERVIDOR      */}
            {/* ========================= */}

            {showCreateServer && (

                <div className="modal-backdrop">


                    <div className="modal-card">


                        <h2>

                            Crear servidor

                        </h2>


                        <p>

                            Dale un nombre a tu
                            nueva comunidad.

                        </p>


                        <label>

                            Nombre

                        </label>


                        <input

                            value={
                                serverName
                            }

                            maxLength={
                                80
                            }

                            placeholder="Mi servidor"

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

                            maxLength={
                                500
                            }

                            placeholder={
                                "Describe brevemente tu servidor..."
                            }

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

                                    setServerName("");

                                    setServerDescription("");

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



            {/* ========================= */}
            {/* MODAL CREAR CANAL         */}
            {/* ========================= */}

            {showCreateChannel && (

                <div className="modal-backdrop">


                    <div className="modal-card">


                        <h2>

                            Crear canal de texto

                        </h2>


                        <p>

                            Crea un nuevo canal dentro
                            de{" "}

                            <strong>

                                {selectedServer?.name}

                            </strong>.

                        </p>


                        <label>

                            Nombre del canal

                        </label>


                        <input

                            value={
                                channelName
                            }

                            maxLength={
                                80
                            }

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


                        <p className="channel-name-help">

                            Los espacios serán convertidos
                            automáticamente a guiones.

                            <br />

                            Ejemplo:{" "}

                            <strong>
                                Backend Java
                            </strong>

                            {" → "}

                            <strong>
                                #backend-java
                            </strong>

                        </p>


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