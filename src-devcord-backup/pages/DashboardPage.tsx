import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    getCurrentUser,
    User
} from "../api/api";

import {
    clearToken
} from "../auth/authStorage";

export default function DashboardPage() {

    const navigate =
        useNavigate();

    const [user, setUser] =
        useState<User | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        async function loadUser() {

            try {

                const currentUser =
                    await getCurrentUser();

                setUser(currentUser);

            } catch {

                clearToken();

                navigate("/login");

            } finally {

                setLoading(false);
            }
        }

        loadUser();

    }, [navigate]);

    function logout() {

        clearToken();

        navigate("/login");
    }

    if (loading) {

        return (
            <div className="loading">
                Cargando DevCord...
            </div>
        );
    }

    return (
        <div className="dashboard">

            <aside className="sidebar">

                <div className="brand">
                    DevCord
                </div>

                <div className="user-card">

                    <div className="avatar">

                        {user?.username
                            .charAt(0)
                            .toUpperCase()
                        }

                    </div>

                    <div>

                        <strong>
                            {user?.username}
                        </strong>

                        <span>
                            {user?.email}
                        </span>

                    </div>

                </div>

                <button
                    className="logout-button"
                    onClick={logout}
                >
                    Cerrar sesión
                </button>

            </aside>

            <main className="content">

                <h1>
                    DevCord
                </h1>

                <p>
                    La autenticación funciona correctamente.
                </p>

                <div className="status-card">

                    <h2>
                        DevCord v0.1.0
                    </h2>

                    <p>
                        Usuario autenticado mediante JWT.
                    </p>

                    <div className="success">
                        Backend conectado correctamente
                    </div>

                </div>

            </main>

        </div>
    );
}