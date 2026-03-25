import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getLevels, getMaterials } from "../services/api"

// Iconos corregidos — cada tipo tiene su propio emoji
const TIPO_ICONS = {
    video:     "🎬",
    pdf:       "📄",
    quiz:      "📝",
    audio:     "🎧",
    ejercicio: "✏️"
}

// Colores para las etiquetas según su tipo
const TAG_COLORS = {
    nivel:     "bg-blue-100 text-blue-700",
    habilidad: "bg-purple-100 text-purple-700",
    tema:      "bg-green-100 text-green-700",
    categoria: "bg-yellow-100 text-yellow-700",
    contexto:  "bg-pink-100 text-pink-700",
}

export default function Catalogo() {

    // ── ESTADO ─────────────────────────────────────────────
    const [materials, setMaterials] = useState([])
    const [levels, setLevels]       = useState([])
    const [filtros, setFiltros]     = useState({ nivel: "", tipo: "" })
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState("")

    const navigate = useNavigate()

    // ── CARGAR NIVELES AL INICIO ───────────────────────────
    useEffect(() => {
        getLevels()
            .then(r => setLevels(r.data))
            .catch(() => {})
    }, [])

    // ── CARGAR MATERIALES CUANDO CAMBIAN LOS FILTROS ───────
    useEffect(() => {
        setLoading(true)

        const params = {}
        if (filtros.nivel) params.nivel = filtros.nivel
        if (filtros.tipo)  params.tipo  = filtros.tipo

        getMaterials(params)
            .then(r => {
                setMaterials(r.data)
                setError("")
            })
            .catch(() => setError("Error al cargar materiales"))
            .finally(() => setLoading(false))
    }, [filtros])

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
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors flex items-center gap-1"
                >
                    ← Dashboard
                </button>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-8">

                {/* ── TÍTULO ──────────────────────────────── */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Catálogo de Materiales
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Explora todos los recursos educativos disponibles
                    </p>
                </div>

                {/* ── FILTROS ─────────────────────────────── */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-wrap gap-4 items-end">

                    {/* Filtro por nivel */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Nivel
                        </label>
                        <select
                            value={filtros.nivel}
                            onChange={e => setFiltros({ ...filtros, nivel: e.target.value })}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                       focus:border-purple-400 bg-white"
                        >
                            <option value="">Todos los niveles</option>
                            {levels.map(l => (
                                <option key={l.id} value={l.codigo}>
                                    {l.codigo} — {l.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por tipo */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Tipo
                        </label>
                        <select
                            value={filtros.tipo}
                            onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm 
                                       focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                       focus:border-purple-400 bg-white"
                        >
                            <option value="">Todos los tipos</option>
                            {["video", "pdf", "quiz", "audio", "ejercicio"].map(t => (
                                <option key={t} value={t}>
                                    {TIPO_ICONS[t]} {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botón limpiar filtros */}
                    {(filtros.nivel || filtros.tipo) && (
                        <button
                            onClick={() => setFiltros({ nivel: "", tipo: "" })}
                            className="text-sm text-red-500 hover:text-red-700 underline pb-1 transition-colors"
                        >
                            ✕ Limpiar filtros
                        </button>
                    )}

                    {/* Contador de resultados */}
                    {!loading && !error && (
                        <span className="text-sm text-gray-400 pb-1 ml-auto">
                            {materials.length} {materials.length === 1 ? "material" : "materiales"}
                        </span>
                    )}
                </div>

                {/* ── ESTADOS DE CARGA Y ERROR ────────────── */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-5xl mb-4 animate-bounce">📚</div>
                        <p>Cargando materiales...</p>
                    </div>

                ) : error ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">⚠️</div>
                        <p className="text-red-500">{error}</p>
                        <button
                            onClick={() => setFiltros({ nivel: "", tipo: "" })}
                            className="mt-4 text-purple-600 underline text-sm"
                        >
                            Reintentar
                        </button>
                    </div>

                ) : materials.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="font-medium text-gray-600">
                            No hay materiales con estos filtros
                        </p>
                        <p className="text-sm mt-1">
                            Intenta con otros criterios de búsqueda
                        </p>
                        <button
                            onClick={() => setFiltros({ nivel: "", tipo: "" })}
                            className="mt-4 text-purple-600 underline text-sm"
                        >
                            Ver todos los materiales
                        </button>
                    </div>

                ) : (
                    /* ── GRID DE MATERIALES ─────────────────── */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {materials.map(m => (
                            <div
                                key={m.id}
                                onClick={() => navigate(`/material/${m.id}`)}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm 
                                           hover:shadow-md cursor-pointer transition-all duration-200
                                           border border-gray-100 p-5 hover:-translate-y-1"
                            >
                                {/* Ícono del tipo */}
                                <div className="text-4xl mb-3">
                                    {TIPO_ICONS[m.tipo] || "📚"}
                                </div>

                                {/* Título */}
                                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                                    {m.titulo}
                                </h3>

                                {/* Etiquetas */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {m.tags?.map(tag => (
                                        <span
                                            key={tag.id}
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium
                                                        ${TAG_COLORS[tag.tag_type] || "bg-gray-100 text-gray-600"}`}
                                        >
                                            {tag.tag_value}
                                        </span>
                                    ))}
                                </div>

                                {/* Footer de la tarjeta */}
                                <div className="mt-4 flex justify-between items-center text-xs text-gray-400 border-t border-gray-50 pt-3">
                                    <span>👁️ {m.vistas_totales} vistas</span>
                                    <span>⭐ {m.rating_promedio?.toFixed(1)}</span>
                                    {m.duracion_segundos && (
                                        <span>⏱️ {Math.floor(m.duracion_segundos / 60)} min</span>
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