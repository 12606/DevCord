import {
    useState
} from "react";

import type {
    FormEvent
} from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    login
} from "../api/api";

import {
    saveToken
} from "../auth/authStorage";

export default function LoginPage() {

    const navigate =
        useNavigate();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function handleSubmit(
        event: FormEvent
    ) {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response =
                await login(
                    email,
                    password
                );

            saveToken(
                response.accessToken
            );

            navigate("/");

        } catch (error) {

            if (error instanceof Error) {
                setError(error.message);
            }

        } finally {

            setLoading(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="brand">
                    DevCord
                </div>

                <h1>
                    Bienvenido de nuevo
                </h1>

                <p className="subtitle">
                    Inicia sesión para continuar.
                </p>

                <form onSubmit={handleSubmit}>

                    <label>
                        Correo electrónico
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                event.target.value
                            )
                        }
                        required
                    />

                    <label>
                        Contraseña
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        required
                    />

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Iniciando..."
                            : "Iniciar sesión"
                        }
                    </button>

                </form>

                <p className="auth-link">
                    ¿No tienes cuenta?{" "}
                    <Link to="/register">
                        Regístrate
                    </Link>
                </p>

            </div>

        </div>
    );
}