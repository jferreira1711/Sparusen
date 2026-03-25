import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

    const [user,         setUser]         = useState(null)
    const [token,        setToken]        = useState(null)
    const [loading,      setLoading]      = useState(false)
    const [initializing, setInitializing] = useState(true)

    // ── CARGAR USUARIO DEL LOCALSTORAGE AL INICIAR ─────────
    useEffect(() => {
        const savedToken = localStorage.getItem("token")
        const savedUser  = localStorage.getItem("user")
        if (savedToken && savedUser) {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
        }
        setInitializing(false)
    }, [])

    // ── LOGIN ──────────────────────────────────────────────
    const login = async (email, password) => {
        setLoading(true)
        try {
            const res = await axios.post("http://localhost:8000/auth/login", {
                email,
                password
            })
            const { access_token, user: userData } = res.data
            localStorage.setItem("token", access_token)
            localStorage.setItem("user", JSON.stringify(userData))
            setToken(access_token)
            setUser(userData)
            return { success: true, user: userData }
        } catch (err) {
            const msg = err.response?.data?.detail || "Error al iniciar sesión"
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }

    // ── REGISTER ───────────────────────────────────────────
    const register = async (formData) => {
        setLoading(true)
        try {
            await axios.post("http://localhost:8000/auth/register", formData)
            return { success: true }
        } catch (err) {
            const msg = err.response?.data?.detail || "Error al registrarse"
            return { success: false, error: msg }
        } finally {
            setLoading(false)
        }
    }

    // ── LOGOUT ─────────────────────────────────────────────
    const logout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            initializing,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)