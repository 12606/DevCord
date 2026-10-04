import {
    FormEvent,
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    register
} from "../api/api";

import {
    saveToken
} from "../auth/authStorage";

export default function RegisterPage() {

    const navigate =
        useNavigate();

    const [username, setUsername] =
        useState("");

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
                await register(
                    username,
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
                    Crear cuenta
                </h1>

                <p className="subtitle">
                    Únete a DevCord.
                </p>

                <form onSubmit={handleSubmit}>

                    <label>
                        Nombre de usuario
                    </label>

                    <input
                        type="text"
                        minLength={3}
                        value={username}
                        onChange={(event) =>
                            setUsername(
                                event.target.value
                            )
                        }
                        required
                    />

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
                        minLength={8}
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
                            ? "Creando..."
                            : "Crear cuenta"
                        }
                    </button>

                </form>

                <p className="auth-link">

                    ¿Ya tienes cuenta?{" "}

                    <Link to="/login">
                        Inicia sesión
                    </Link>

                </p>

            </div>

        </div>
    );
}