import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function Login() {

    const [email,        setEmail]        = useState("")
    const [password,     setPassword]     = useState("")
    const [error,        setError]        = useState("")
    const [loading,      setLoading]      = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const navigate    = useNavigate()
    const { login }   = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const result = await login(email, password)

        if (result.success) {
            navigate("/dashboard")
        } else {
            setError(result.error)
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 lg:p-8">
            <div className="w-full max-w-6xl flex items-center gap-8">

                {/* ── IMAGEN LATERAL ── */}
                <div className="hidden lg:flex lg:flex-1 relative">
                    <div className="relative w-full h-[700px] rounded-3xl overflow-hidden shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1602114324271-08ea0e9f7a95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                            alt="Educación"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
                            <h2 className="text-4xl font-bold mb-4">Aprende sin límites</h2>
                            <p className="text-lg text-purple-100">
                                Accede a miles de recursos educativos y comienza tu viaje de aprendizaje hoy mismo.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── FORMULARIO ── */}
                <div className="w-full lg:flex-1">
                    <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-8">

                        {/* Logo */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Bienvenido
                            </h1>
                            <p className="text-gray-500 text-sm mt-2">
                                Inicia sesión para continuar
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Correo electrónico
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="tu@ejemplo.com"
                                        className="w-full pl-11 pr-4 h-12 rounded-xl border border-gray-200 
                                                   focus:outline-none focus:border-purple-400 focus:ring-2 
                                                   focus:ring-purple-400/20"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-11 h-12 rounded-xl border border-gray-200 
                                                   focus:outline-none focus:border-purple-400 focus:ring-2 
                                                   focus:ring-purple-400/20"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword
                                            ? <EyeOff className="w-5 h-5" />
                                            : <Eye className="w-5 h-5" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Botón */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 
                                           hover:from-purple-700 hover:to-blue-700 text-white rounded-xl 
                                           shadow-lg hover:shadow-xl transition-all duration-200 
                                           text-base font-semibold disabled:opacity-50"
                            >
                                {loading ? "Iniciando..." : "Iniciar sesión"}
                            </button>

                            {/* Separador */}
                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 text-gray-500 bg-white">o</span>
                                </div>
                            </div>

                            {/* Registro */}
                            <div className="text-center space-y-3">
                                <p className="text-sm text-gray-600">¿No tienes una cuenta?</p>
                                <Link
                                    to="/register"
                                    className="w-full h-12 rounded-xl border-2 border-purple-200 
                                               text-purple-600 hover:bg-purple-50 hover:border-purple-300 
                                               font-semibold transition-all duration-200 flex items-center 
                                               justify-center"
                                >
                                    Registrarse
                                </Link>
                            </div>

                        </form>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        © 2026 Plataforma Idiomas. Todos los derechos reservados.
                    </p>
                </div>

            </div>
        </div>
    )
}