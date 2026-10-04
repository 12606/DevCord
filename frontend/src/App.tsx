import {
    Navigate,
    Outlet,
    Route,
    Routes
} from "react-router-dom";

import LoginPage
    from "./pages/LoginPage";

import RegisterPage
    from "./pages/RegisterPage";

import DashboardPage
    from "./pages/DashboardPage";

import {
    getToken
} from "./auth/authStorage";

function ProtectedRoute() {

    const token =
        getToken();

    if (!token) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return <Outlet />;
}

export default function App() {

    return (
        <Routes>

            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route
                path="/register"
                element={<RegisterPage />}
            />

            <Route element={<ProtectedRoute />}>

                <Route
                    path="/"
                    element={<DashboardPage />}
                />

            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />

        </Routes>
    );
}