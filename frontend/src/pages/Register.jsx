import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Mail, Lock, Eye, EyeOff, Sparkles, User, ArrowLeft } from "lucide-react"

export default function Register() {

  const [form, setForm] = useState({
    nombre:          "",
    email:           "",
    password:        "",
    rol:             "student",
    idioma_objetivo: "inglés",
    idioma_nativo:   "español"
  })
  const [confirmPassword, setConfirmPassword]         = useState("")
  const [error, setError]                             = useState("")
  const [loading, setLoading]                         = useState(false)
  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate      = useNavigate()
  const { register }  = useAuth()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    setError("")

    const result = await register(form)

    if (result.success) {
      navigate("/login")
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 lg:p-8">
      <div className="w-full max-w-6xl flex items-center gap-8">

        {/* ── IMAGEN LATERAL — solo visible en desktop ── */}
        <div className="hidden lg:flex lg:flex-1 relative">
          <div className="relative w-full h-[700px] rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1602114324271-08ea0e9f7a95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
              alt="Educación"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
              <h2 className="text-4xl font-bold mb-4">
                Comienza hoy
              </h2>
              <p className="text-lg text-purple-100">
                Crea tu cuenta y únete a miles de estudiantes que ya aprenden con nosotros.
              </p>
            </div>
          </div>
        </div>

        {/* ── FORMULARIO ── */}
        <div className="w-full lg:flex-1">
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-8">

            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Crear cuenta
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Regístrate para comenzar tu aprendizaje
              </p>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Campo nombre */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-gray-200 
                               focus:outline-none focus:border-purple-400 focus:ring-2 
                               focus:ring-purple-400/20"
                    required
                  />
                </div>
              </div>

              {/* Campo email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="tu@ejemplo.com"
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-gray-200 
                               focus:outline-none focus:border-purple-400 focus:ring-2 
                               focus:ring-purple-400/20"
                    required
                  />
                </div>
              </div>

              {/* Campo contraseña */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-11 pr-11 h-12 rounded-xl border border-gray-200 
                               focus:outline-none focus:border-purple-400 focus:ring-2 
                               focus:ring-purple-400/20"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                               hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Campo confirmar contraseña */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 h-12 rounded-xl border border-gray-200 
                               focus:outline-none focus:border-purple-400 focus:ring-2 
                               focus:ring-purple-400/20"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                               hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Campo idioma objetivo */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Idioma que quieres aprender
                </label>
                <input
                  type="text"
                  name="idioma_objetivo"
                  value={form.idioma_objetivo}
                  onChange={handleChange}
                  placeholder="inglés"
                  className="w-full px-4 h-12 rounded-xl border border-gray-200 
                             focus:outline-none focus:border-purple-400 focus:ring-2 
                             focus:ring-purple-400/20"
                  required
                />
              </div>

              {/* Selector de rol */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Soy...
                </label>
                <select
                  name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  className="w-full px-4 h-12 rounded-xl border border-gray-200 
                             focus:outline-none focus:border-purple-400 focus:ring-2 
                             focus:ring-purple-400/20 bg-white"
                >
                  <option value="student">Estudiante</option>
                  <option value="teacher">Profesor</option>
                </select>
              </div>

              {/* Botón de registro */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 
                           hover:from-purple-700 hover:to-blue-700 text-white rounded-xl 
                           shadow-lg hover:shadow-xl transition-all duration-200 
                           text-base font-semibold disabled:opacity-50"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
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

              {/* Enlace al login */}
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">¿Ya tienes una cuenta?</p>
                <Link
                  to="/login"
                  className="w-full h-12 rounded-xl border-2 border-purple-200 
                             text-purple-600 hover:bg-purple-50 hover:border-purple-300 
                             font-semibold transition-all duration-200 flex items-center 
                             justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a iniciar sesión
                </Link>
              </div>

            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            © 2026 Plataforma Idiomas. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </div>
  )
}