import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
  Globe,
  LogOut,
  Mail,
  UserCircle,
  CheckCircle,
  BookOpen,
  BarChart3,
  Video,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  FileQuestion,
  Sparkles
} from "lucide-react"

export default function Dashboard() {

  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const accesoRapido = [
    {
      icon:        BookOpen,
      title:       "Catalogo de materiales",
      desc:        "Explora todos los recursos educativos disponibles",
      route:       "/catalogo",
      colorIcon:   "from-blue-500 to-blue-600",
      colorBorder: "border-t-blue-500",
      colorText:   "text-blue-600",
      colorBg:     "bg-blue-100",
      linkText:    "Ver recursos"
    },
    {
      icon:        BarChart3,
      title:       "Mi progreso",
      desc:        "Ve cuanto has avanzado en tu aprendizaje",
      route:       "/progreso",
      colorIcon:   "from-green-500 to-emerald-600",
      colorBorder: "border-t-green-500",
      colorText:   "text-green-600",
      colorBg:     "bg-green-100",
      linkText:    "Ver estadisticas"
    },
    {
      icon:        Video,
      title:       "Mis clases en vivo",
      desc:        "Clases virtuales con video, chat y pizarra",
      route:       "/clases",
      colorIcon:   "from-purple-500 to-purple-600",
      colorBorder: "border-t-purple-500",
      colorText:   "text-purple-600",
      colorBg:     "bg-purple-100",
      linkText:    "Ver clases"
    },
  ]

  const proximasFase = [
    "Motor de recomendaciones con IA y Machine Learning",
    "Analisis automatico de errores por habilidad",
    "Panel de estadisticas avanzado del estudiante",
    "Sistema de notificaciones en tiempo real",
  ]

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Plataforma Idiomas</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg">
                <UserCircle className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white capitalize">
                  {user?.rol === "student" ? "Estudiante" : "Profesor"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesion
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tarjeta de bienvenida */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-7 h-7 text-purple-500" />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                {"Bienvenido, " + (user?.nombre || "Usuario") + "!"}
              </h2>
            </div>
            <p className="text-slate-600">
              Es genial verte de nuevo. Continua tu camino de aprendizaje.
            </p>
          </div>
        </div>

        {/* Tarjetas de informacion del usuario */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div className="bg-white border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user?.email || "---"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Rol</p>
                <p className="text-sm font-semibold text-slate-800 capitalize">
                  {user?.rol || "---"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Estado</p>
                <p className="text-sm font-semibold text-green-600">
                  {user?.activo ? "Activo" : "Inactivo"}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Accesos rapidos */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6">
            Acceso rapido
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accesoRapido.map(card => {
              const Icon = card.icon
              return (
                <div
                  key={card.route}
                  onClick={() => navigate(card.route)}
                  className={"bg-white border-t-4 " + card.colorBorder + " shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl p-6 cursor-pointer group hover:-translate-y-2"}
                >
                  <div className="flex flex-col h-full">
                    <div className={"w-16 h-16 bg-gradient-to-br " + card.colorIcon + " rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg"}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">
                      {card.title}
                    </h4>
                    <p className="text-sm text-slate-600 flex-1">
                      {card.desc}
                    </p>
                    <div className={"mt-4 flex items-center font-medium text-sm " + card.colorText}>
                      {card.linkText}
                      <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Tarjeta extra solo para profesores */}
            {user?.rol === "teacher" && (
              <div
                onClick={() => navigate("/catalogo")}
                className="bg-white border-t-4 border-t-orange-500 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl p-6 cursor-pointer group hover:-translate-y-2"
              >
                <div className="flex flex-col h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <FileQuestion className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">
                    Crear preguntas de quiz
                  </h4>
                  <p className="text-sm text-slate-600 flex-1">
                    Agrega preguntas reales a tus materiales de tipo quiz
                  </p>
                  <p className="text-xs text-orange-500 mt-2">
                    Accede desde el detalle de un material tipo quiz
                  </p>
                  <div className="mt-3 flex items-center font-medium text-sm text-orange-600">
                    Ir al catalogo
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Seccion inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Proximas clases */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Proximas clases</h4>
            </div>
            <div className="space-y-3">
              <div
                onClick={() => navigate("/clases")}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800">
                    Ver mis clases programadas
                  </p>
                  <p className="text-xs text-slate-500">
                    Accede a tu aula virtual
                  </p>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </div>
              <div
                onClick={() => navigate("/clases")}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Video className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800">
                    {user?.rol === "teacher" ? "Crear nueva clase" : "Unirse a una clase"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Video, chat y pizarra colaborativa
                  </p>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            </div>
          </div>

          {/* Proximas fases / Logros */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Proximamente en Fase 4</h4>
            </div>
            <div className="space-y-3">
              {proximasFase.map((item, idx) => {
                const colores = [
                  "from-blue-500 to-purple-600",
                  "from-green-500 to-emerald-600",
                  "from-orange-500 to-amber-500",
                  "from-pink-500 to-rose-500",
                ]
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className={"w-8 h-8 bg-gradient-to-br " + colores[idx] + " rounded-full flex items-center justify-center flex-shrink-0"}>
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

      </main>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="mt-12 py-6 bg-white/50 backdrop-blur-sm border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-600">
            2026 Plataforma Idiomas. Todos los derechos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}
