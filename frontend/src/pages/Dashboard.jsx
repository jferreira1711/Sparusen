import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getMyProgress, getRecommendations, getMySkills } from "../services/api"
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
  Sparkles,
  Brain,
  ChevronRight
} from "lucide-react"

const TIPO_ICON = {
  video:     "Video",
  pdf:       "PDF",
  quiz:      "Quiz",
  audio:     "Audio",
  ejercicio: "Ejercicio"
}

const ALGO_CONFIG = {
  "hybrid-cb":      { label: "Basado en tu historial",    color: "bg-blue-100 text-blue-700" },
  "hybrid-col":     { label: "Estudiantes similares",     color: "bg-purple-100 text-purple-700" },
  "content-based":  { label: "Contenido similar",         color: "bg-teal-100 text-teal-700" },
  "collaborative":  { label: "Filtrado colaborativo",     color: "bg-orange-100 text-orange-700" },
}

export default function Dashboard() {

  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const [progressCount, setProgressCount] = useState(0)
  const [recs,          setRecs]          = useState([])
  const [skills,        setSkills]        = useState([])
  const [loadingRecs,   setLoadingRecs]   = useState(true)

  useEffect(() => {
    getMyProgress()
      .then(r => setProgressCount(r.data.length))
      .catch(() => {})

    getRecommendations(3)
      .then(r => setRecs(r.data))
      .catch(() => {})
      .finally(() => setLoadingRecs(false))

    getMySkills()
      .then(r => setSkills(r.data))
      .catch(() => {})
  }, [])

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
      linkText:    "Ver recursos"
    },
    {
      icon:        Brain,
      title:       "Para ti",
      desc:        "Recomendaciones personalizadas con IA",
      route:       "/recommendations",
      colorIcon:   "from-purple-500 to-pink-500",
      colorBorder: "border-t-purple-500",
      colorText:   "text-purple-600",
      linkText:    "Ver recomendaciones"
    },
    {
      icon:        BarChart3,
      title:       "Mi progreso",
      desc:        "Ve cuanto has avanzado en tu aprendizaje",
      route:       "/progreso",
      colorIcon:   "from-green-500 to-emerald-600",
      colorBorder: "border-t-green-500",
      colorText:   "text-green-600",
      linkText:    "Ver estadisticas"
    },
    {
      icon:        Video,
      title:       "Mis clases en vivo",
      desc:        "Clases virtuales con video, chat y pizarra",
      route:       "/clases",
      colorIcon:   "from-indigo-500 to-indigo-600",
      colorBorder: "border-t-indigo-500",
      colorText:   "text-indigo-600",
      linkText:    "Ver clases"
    },
  ]

  const SKILL_COLORS = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-teal-600",
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
          <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-7 h-7 text-purple-500" />
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                {"Hola, " + (user?.nombre || "Usuario") + "!"}
              </h2>
            </div>
            <p className="text-slate-600">
              {progressCount > 0
                ? progressCount + " materiales estudiados. Sigue asi!"
                : "Es genial verte de nuevo. Continua tu camino de aprendizaje."}
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
          <h3 className="text-xl font-bold text-slate-800 mb-6">Acceso rapido</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {accesoRapido.map(card => {
              const Icon = card.icon
              return (
                <div
                  key={card.route}
                  onClick={() => navigate(card.route)}
                  className={"bg-white border-t-4 " + card.colorBorder + " shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl p-6 cursor-pointer group hover:-translate-y-2"}
                >
                  <div className="flex flex-col h-full">
                    <div className={"w-14 h-14 bg-gradient-to-br " + card.colorIcon + " rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg"}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mb-1">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-600 flex-1">
                      {card.desc}
                    </p>
                    <div className={"mt-4 flex items-center font-medium text-xs " + card.colorText}>
                      {card.linkText}
                      <span className="ml-1 group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Tarjeta solo para profesores */}
            {user?.rol === "teacher" && (
              <div
                onClick={() => navigate("/catalogo")}
                className="bg-white border-t-4 border-t-orange-500 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl p-6 cursor-pointer group hover:-translate-y-2"
              >
                <div className="flex flex-col h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <FileQuestion className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">
                    Crear preguntas
                  </h4>
                  <p className="text-xs text-slate-600 flex-1">
                    Agrega preguntas a tus materiales de tipo quiz
                  </p>
                  <div className="mt-4 flex items-center font-medium text-xs text-orange-600">
                    Ir al catalogo
                    <span className="ml-1 group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SECCIÓN ML — Recomendaciones + Habilidades ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Recomendaciones ML */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Recomendado para ti</h4>
              </div>
              <button
                onClick={() => navigate("/recommendations")}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                Ver todas
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {loadingRecs ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-1">
                  Aun no hay recomendaciones
                </p>
                <p className="text-slate-400 text-xs mb-4">
                  Completa materiales del catalogo primero
                </p>
                <button
                  onClick={() => navigate("/catalogo")}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  Ir al catalogo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recs.slice(0, 3).map(rec => {
                  const algo = ALGO_CONFIG[rec.algoritmo] || ALGO_CONFIG["hybrid-cb"]
                  return (
                    <div
                      key={rec.id}
                      onClick={() => navigate("/material/" + rec.material_id)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-slate-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-600">
                          {TIPO_ICON[rec.tipo] || "Mat"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">
                          {rec.titulo}
                        </p>
                        <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + algo.color}>
                          {algo.label}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-purple-600">
                          {Math.round(rec.score * 100)}%
                        </p>
                        <p className="text-xs text-slate-400">relevancia</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Habilidades */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Mis habilidades</h4>
            </div>

            {skills.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm mb-1">Sin datos aun</p>
                <p className="text-slate-400 text-xs">
                  Completa quizzes para ver tus habilidades
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {skills.map((s, idx) => (
                  <div key={s.habilidad} className="flex items-center gap-3">
                    <div className={"w-8 h-8 bg-gradient-to-br " + SKILL_COLORS[idx % SKILL_COLORS.length] + " rounded-lg flex items-center justify-center flex-shrink-0"}>
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-slate-700 capitalize">
                          {s.habilidad}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {s.score.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={"bg-gradient-to-r " + SKILL_COLORS[idx % SKILL_COLORS.length] + " h-2 rounded-full transition-all duration-500"}
                          style={{ width: Math.min(s.score, 100) + "%" }}
                        />
                      </div>
                    </div>
                    {s.tendencia && (
                      <span className={"text-xs px-2 py-0.5 rounded-full " + (
                        s.tendencia === "mejorando"  ? "bg-green-100 text-green-700" :
                        s.tendencia === "empeorando" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {s.tendencia === "mejorando"  ? "↑" :
                         s.tendencia === "empeorando" ? "↓" : "→"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Seccion inferior — Clases + Proxima fase */}
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
                  <p className="text-xs text-slate-500">Accede a tu aula virtual</p>
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
                  <p className="text-xs text-slate-500">Video, chat y pizarra colaborativa</p>
                </div>
                <span className="text-slate-400 text-sm">→</span>
              </div>
            </div>
          </div>

          {/* Proxima fase */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Proximamente en Fase 5</h4>
            </div>
            <div className="space-y-3">
              {[
                "Panel de administracion completo",
                "Reportes y estadisticas avanzadas",
                "Sistema de notificaciones push",
                "Exportacion de progreso a PDF",
              ].map((item, idx) => {
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
