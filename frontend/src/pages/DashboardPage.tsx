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


    const [error, setError] =
        useState("");


    const [loading, setLoading] =
        useState(true);


    useEffect(() => {

        async function initialize() {

            try {

                const [
                    currentUser,
                    serverList
                ] =
                    await Promise.all([
                        getCurrentUser(),
                        getServers()
                    ]);


                setUser(
                    currentUser
                );


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

            } catch {

                clearToken();

                navigate(
                    "/login"
                );

            } finally {

                setLoading(false);
            }
        }


        initialize();

    }, [navigate]);


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


    function logout() {

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

                            onClick={() =>
                                setSelectedServer(
                                    server
                                )
                            }
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

                    onClick={() =>
                        setShowCreateServer(
                            true
                        )
                    }
                >
                    +
                </button>

            </aside>


            <aside className="channel-panel">

                <div className="server-header">

                    {selectedServer
                        ? selectedServer.name
                        : "DevCord"
                    }

                </div>


                <div className="channel-placeholder">

                    {selectedServer ? (

                        <>
                            <span>
                                CANALES DE TEXTO
                            </span>

                            <p>
                                Los canales se agregarán
                                en DevCord v0.3.
                            </p>
                        </>

                    ) : (

                        <p>
                            Crea tu primer servidor
                            para comenzar.
                        </p>
                    )}

                </div>


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
                        onClick={logout}

                        className="logout-icon"

                        title="Cerrar sesión"
                    >
                        ↪
                    </button>

                </div>

            </aside>


            <main className="main-panel">

                {selectedServer ? (

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


                        <section className="welcome-panel">

                            <div className="server-avatar-large">

                                {selectedServer
                                    .name
                                    .charAt(0)
                                    .toUpperCase()
                                }

                            </div>


                            <h1>
                                Bienvenido a{" "}
                                {selectedServer.name}
                            </h1>


                            <p>

                                {selectedServer
                                    .description
                                    ||
                                    "Este servidor todavía no tiene descripción."
                                }

                            </p>


                            <div className="phase-message">

                                Servidor creado correctamente.
                                En la siguiente fase agregaremos
                                canales de texto.

                            </div>

                        </section>

                    </>

                ) : (

                    <section className="empty-server-state">

                        <h1>
                            Bienvenido a DevCord
                        </h1>

                        <p>
                            Crea tu primer servidor.
                        </p>

                        <button
                            onClick={() =>
                                setShowCreateServer(
                                    true
                                )
                            }
                        >
                            Crear servidor
                        </button>

                    </section>
                )}

            </main>


            {showCreateServer && (

                <div className="modal-backdrop">

                    <div className="modal-card">

                        <h2>
                            Crear servidor
                        </h2>


                        <p>
                            Dale un nombre a tu nueva comunidad.
                        </p>


                        <label>
                            Nombre
                        </label>


                        <input
                            value={serverName}

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

        </div>
    );
}