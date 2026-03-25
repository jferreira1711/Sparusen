import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function PrivateRoute({ children }) {
    const { user, initializing } = useAuth()

    // Mientras carga el localStorage no redirige
    if (initializing) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-gray-400 text-center">
                <div className="text-4xl mb-2 animate-spin">⚙️</div>
                <p>Cargando...</p>
            </div>
        </div>
    )

    return user ? children : <Navigate to="/login" replace />
}