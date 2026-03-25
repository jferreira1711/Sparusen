import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getMaterial, registerProgress } from "../services/api"
import { useAuth } from "../context/AuthContext"

const TIPO_ICONS = {
    video:     "Video",
    pdf:       "PDF",
    quiz:      "Quiz",
    audio:     "Audio",
    ejercicio: "Ejercicio"
}

const TAG_COLORS = {
    nivel:     "bg-blue-100 text-blue-700",
    habilidad: "bg-purple-100 text-purple-700",
    tema:      "bg-green-100 text-green-700",
    categoria: "bg-yellow-100 text-yellow-700",
    contexto:  "bg-pink-100 text-pink-700",
}

export default function MaterialDetalle() {

    const { id }                          = useParams()
    const navigate                        = useNavigate()
    const { user }                        = useAuth()
    const [material,     setMaterial]     = useState(null)
    const [loading,      setLoading]      = useState(true)
    const [completed,    setCompleted]    = useState(false)
    const [saving,       setSaving]       = useState(false)
    const [error,        setError]        = useState("")
    const [startTime]                     = useState(Date.now())
    const [tiempoActual, setTiempoActual] = useState(0)

    useEffect(() => {
        getMaterial(id)
            .then(r => setMaterial(r.data))
            .catch(() => navigate("/catalogo"))
            .finally(() => setLoading(false))
    }, [id])

    useEffect(() => {
        const interval = setInterval(() => {
            setTiempoActual(Math.floor((Date.now() - startTime) / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [startTime])

    const handleComplete = async () => {
        setSaving(true)
        const segundos = Math.floor((Date.now() - startTime) / 1000)
        try {
            await registerProgress({
                material_id:     id,
                tiempo_segundos: segundos,
                completitud_pct: 100.0,
                completado:      true
            })
            setCompleted(true)
        } catch (e) {
            setError("Error al guardar progreso. Intenta de nuevo.")
        } finally {
            setSaving(false)
        }
    }

    const formatTiempo = (segundos) => {
        const min = Math.floor(segundos / 60)
        const seg = segundos % 60
        return min + ":" + seg.toString().padStart(2, "0")
    }

    const abrirEnNuevaPestana = (url) => {
        window.open(url, "_blank", "noopener,noreferrer")
    }

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
            <div className="text-center text-gray-400">
                <p className="text-5xl mb-4">📚</p>
                <p>Cargando material...</p>
            </div>
        </div>
    )

    if (!material) return null

    const urlRecurso = String(material.url_recurso || "")
    const esYoutube  = urlRecurso.includes("youtube")

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">

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
                    onClick={() => navigate("/catalogo")}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                    Volver al catalogo
                </button>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 p-8">

                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-purple-600">
                                {TIPO_ICONS[material.tipo] || material.tipo}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                    {material.tipo}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {"Dificultad: " + material.dificultad + "/5"}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {material.titulo}
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {material.tags?.map(tag => (
                            <span
                                key={tag.id}
                                className={"text-xs px-3 py-1 rounded-full font-medium " + (TAG_COLORS[tag.tag_type] || "bg-gray-100 text-gray-600")}
                            >
                                {tag.tag_value}
                            </span>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-gray-800">{material.vistas_totales}</p>
                            <p className="text-xs text-gray-500">Vistas</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-gray-800">
                                {material.rating_promedio ? material.rating_promedio.toFixed(1) : "0.0"}
                            </p>
                            <p className="text-xs text-gray-500">Rating</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-gray-800">
                                {material.duracion_segundos
                                    ? Math.floor(material.duracion_segundos / 60) + " min"
                                    : "---"}
                            </p>
                            <p className="text-xs text-gray-500">Duracion</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">

                        {material.tipo === "video" && esYoutube && (
                            <div style={{ position: "relative", paddingTop: "56.25%" }}>
                                <iframe
                                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "12px" }}
                                    src={urlRecurso.replace("watch?v=", "embed/")}
                                    title={material.titulo}
                                    allowFullScreen
                                />
                            </div>
                        )}

                        {material.tipo === "video" && !esYoutube && (
                            <video controls className="w-full rounded-xl">
                                <source src={urlRecurso} />
                            </video>
                        )}

                        {material.tipo === "audio" && (
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-3">Reproducir audio:</p>
                                <audio controls className="w-full">
                                    <source src={urlRecurso} />
                                </audio>
                            </div>
                        )}

                        {material.tipo === "pdf" && (
                            <button
                                onClick={() => abrirEnNuevaPestana(urlRecurso)}
                                className="flex items-center gap-3 w-full bg-white rounded-xl p-4 border border-gray-200 text-purple-600 hover:bg-purple-50 transition-colors font-medium"
                            >
                                <span className="text-2xl">📄</span>
                                <span>Abrir PDF en nueva pestana</span>
                                <span className="ml-auto text-gray-400">→</span>
                            </button>
                        )}

                        {material.tipo === "quiz" && (
                            <div className="text-center py-4">
                                <p className="text-5xl mb-4">📝</p>
                                <p className="text-gray-600 font-medium mb-6">
                                    Quiz interactivo con preguntas reales
                                </p>
                                <button
                                    onClick={() => navigate("/quiz/" + material.id)}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                                >
                                    Comenzar Quiz
                                </button>
                            </div>
                        )}

                        {material.tipo === "ejercicio" && (
                            <button
                                onClick={() => abrirEnNuevaPestana(urlRecurso)}
                                className="flex items-center gap-3 w-full bg-white rounded-xl p-4 border border-gray-200 text-purple-600 hover:bg-purple-50 transition-colors font-medium"
                            >
                                <span className="text-2xl">✏️</span>
                                <span>Abrir ejercicio en nueva pestana</span>
                                <span className="ml-auto text-gray-400">→</span>
                            </button>
                        )}

                    </div>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                        <span>{"Tiempo en esta pagina: " + formatTiempo(tiempoActual)}</span>
                        {material.duracion_segundos && (
                            <span>
                                {"Duracion estimada: " + Math.floor(material.duracion_segundos / 60) + " min"}
                            </span>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {material.tipo !== "quiz" && (
                        !completed ? (
                            <button
                                onClick={handleComplete}
                                disabled={saving}
                                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all duration-200 text-base font-semibold disabled:opacity-50"
                            >
                                {saving ? "Guardando progreso..." : "Marcar como completado"}
                            </button>
                        ) : (
                            <div className="w-full bg-green-50 border border-green-200 text-green-700 font-semibold py-3 rounded-xl text-center">
                                Completado! Tu progreso fue guardado correctamente.
                            </div>
                        )
                    )}

                    {user && user.rol === "teacher" && material && material.tipo === "quiz" && (
                        <button
                            onClick={() => navigate("/quiz-editor/" + material.id)}
                            className="w-full mt-3 h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg"
                        >
                            Crear preguntas para este quiz
                        </button>
                    )}

                    {completed && (
                        <button
                            onClick={() => navigate("/catalogo")}
                            className="w-full mt-3 h-12 rounded-xl border-2 border-purple-200 text-purple-600 hover:bg-purple-50 font-semibold transition-all duration-200"
                        >
                            Volver al catalogo
                        </button>
                    )}

                </div>
            </main>
        </div>
    )
}
