import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getClasses, createClass } from "../services/api"
import { useAuth } from "../context/AuthContext"

// Colores para cada estado de la clase
const ESTADO_COLORS = {
    programada: "bg-blue-100 text-blue-700",
    en_curso:   "bg-green-100 text-green-700",
    finalizada: "bg-gray-100 text-gray-600",
    cancelada:  "bg-red-100 text-red-600",
}

// Iconos para cada estado
const ESTADO_ICONS = {
    programada: "📅",
    en_curso:   "🔴",
    finalizada: "✅",
    cancelada:  "❌",
}

export default function Classes() {

    // ── ESTADO ─────────────────────────────────────────────
    const { user }                    = useAuth()
    const navigate                    = useNavigate()
    const [classes, setClasses]       = useState([])
    const [loading, setLoading]       = useState(true)
    const [showForm, setShowForm]     = useState(false)
    const [error, setError]           = useState("")
    const [form, setForm]             = useState({
        student_id:        "",
        fecha_hora_inicio: "",
        tema_clase:        "",
        duracion_minutos:  60
    })

    // ── CARGAR CLASES AL INICIO ────────────────────────────
    useEffect(() => {
        getClasses()
            .then(r => setClasses(r.data))
            .catch(() => setError("Error al cargar las clases"))
            .finally(() => setLoading(false))
    }, [])

    // ── CREAR CLASE NUEVA ──────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            const res = await createClass(form)
            setClasses(c => [res.data, ...c])
            setShowForm(false)
            setForm({
                student_id:        "",
                fecha_hora_inicio: "",
                tema_clase:        "",
                duracion_minutos:  60
            })
        } catch(err) {
            alert(err.response?.data?.detail || "Error al crear clase")
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">

            {/* ── NAVBAR ──────────────────────────────────── */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">PI</span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Plataforma Idiomas
                    </span>
                </div>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                    ← Dashboard
                </button>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-8">

                {/* ── TÍTULO Y BOTÓN CREAR ────────────────── */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Mis clases
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {user?.rol === "teacher"
                                ? "Gestiona tus sesiones de clase"
                                : "Tus clases programadas"}
                        </p>
                    </div>
                    {user?.rol === "teacher" && (
                        <button
                            onClick={() => setShowForm(f => !f)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600
                                       hover:from-purple-700 hover:to-blue-700
                                       text-white px-4 py-2 rounded-xl
                                       shadow-lg transition-all duration-200
                                       font-medium text-sm"
                        >
                            + Nueva clase
                        </button>
                    )}
                </div>

                {/* ── FORMULARIO CREAR CLASE ──────────────── */}
                {showForm && (
                    <form
                        onSubmit={handleCreate}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 space-y-4 border border-gray-100"
                    >
                        <h2 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Nueva sesión de clase
                        </h2>

                        <div className="grid grid-cols-2 gap-4">

                            {/* ID del estudiante */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 block mb-1">
                                    ID del estudiante
                                </label>
                                <input
                                    value={form.student_id}
                                    onChange={e => setForm(f => ({...f, student_id: e.target.value}))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                               focus:border-purple-400"
                                    placeholder="UUID del estudiante"
                                    required
                                />
                            </div>

                            {/* Fecha y hora */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 block mb-1">
                                    Fecha y hora
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.fecha_hora_inicio}
                                    onChange={e => setForm(f => ({...f, fecha_hora_inicio: e.target.value}))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                               focus:border-purple-400"
                                    required
                                />
                            </div>

                            {/* Tema */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 block mb-1">
                                    Tema de la clase
                                </label>
                                <input
                                    value={form.tema_clase}
                                    onChange={e => setForm(f => ({...f, tema_clase: e.target.value}))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                               focus:border-purple-400"
                                    placeholder="Inglés A1 — Saludos"
                                />
                            </div>

                            {/* Duración */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 block mb-1">
                                    Duración (minutos)
                                </label>
                                <input
                                    type="number"
                                    value={form.duracion_minutos}
                                    onChange={e => setForm(f => ({...f, duracion_minutos: parseInt(e.target.value)}))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                               focus:border-purple-400"
                                />
                            </div>
                        </div>

                        {/* Botones del formulario */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-purple-600 to-blue-600
                                           hover:from-purple-700 hover:to-blue-700
                                           text-white px-6 py-2 rounded-xl
                                           font-medium transition-all duration-200"
                            >
                                Crear clase
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="border border-gray-200 px-6 py-2 rounded-xl
                                           hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}

                {/* ── LISTA DE CLASES ─────────────────────── */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-5xl mb-4 animate-bounce">📅</div>
                        <p>Cargando clases...</p>
                    </div>

                ) : error ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">⚠️</div>
                        <p className="text-red-500">{error}</p>
                    </div>

                ) : classes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📅</div>
                        <p className="text-gray-500 font-medium">
                            No tienes clases programadas
                        </p>
                        {user?.rol === "teacher" && (
                            <p className="text-gray-400 text-sm mt-2">
                                Crea una nueva clase con el botón de arriba
                            </p>
                        )}
                    </div>

                ) : (
                    <div className="space-y-4">
                        {classes.map(cls => (
                            <div
                                key={cls.id}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm
                                           border border-gray-100 p-5
                                           flex justify-between items-center
                                           hover:shadow-md transition-shadow"
                            >
                                {/* Info de la clase */}
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-800 text-lg">
                                        {cls.tema_clase || "Clase sin tema"}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                                        <span>
                                            📅 {new Date(cls.fecha_hora_inicio).toLocaleString()}
                                        </span>
                                        <span>
                                            ⏱️ {cls.duracion_minutos} min
                                        </span>
                                    </div>
                                    {cls.url_sala && (
                                        <div className="text-xs text-purple-600 mt-1">
                                            🔗 Sala activa
                                        </div>
                                    )}
                                </div>

                                {/* Estado y botón */}
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${ESTADO_COLORS[cls.estado]}`}>
                                        {ESTADO_ICONS[cls.estado]} {cls.estado}
                                    </span>
                                    {cls.estado !== "finalizada" && cls.estado !== "cancelada" && (
                                        <button
                                            onClick={() => navigate(`/classroom/${cls.id}`)}
                                            className="bg-gradient-to-r from-purple-600 to-blue-600
                                                       hover:from-purple-700 hover:to-blue-700
                                                       text-white px-4 py-1 rounded-xl text-sm
                                                       font-medium transition-all duration-200
                                                       shadow-sm"
                                        >
                                            {cls.estado === "en_curso" ? "Continuar →" : "Entrar →"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </main>
        </div>
    )
}