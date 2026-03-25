import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getQuestions, submitQuiz } from "../services/api"

export default function Quiz() {

    // ── PARAMS ─────────────────────────────────────────────
    const { id }   = useParams()
    const navigate = useNavigate()

    // ── ESTADO ─────────────────────────────────────────────
    const [preguntas,   setPreguntas]   = useState([])
    const [current,     setCurrent]     = useState(0)
    const [answers,     setAnswers]     = useState({})
    const [result,      setResult]      = useState(null)
    const [elapsed,     setElapsed]     = useState(0)
    const [loading,     setLoading]     = useState(true)
    const [submitting,  setSubmitting]  = useState(false)

    // ── CARGAR PREGUNTAS DESDE LA BD ───────────────────────
    useEffect(() => {
        getQuestions(id)
            .then(r => setPreguntas(r.data))
            .catch(() => navigate("/catalogo"))
            .finally(() => setLoading(false))
    }, [id])

    // ── TEMPORIZADOR ───────────────────────────────────────
    useEffect(() => {
        if (result || loading) return
        const t = setInterval(() => setElapsed(s => s + 1), 1000)
        return () => clearInterval(t)
    }, [result, loading])

    // ── SELECCIONAR RESPUESTA ──────────────────────────────
    const selectAnswer = (pregId, letra) => {
        setAnswers(a => ({ ...a, [pregId]: letra }))
    }

    // ── ENVIAR QUIZ ────────────────────────────────────────
    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const res = await submitQuiz(id, {
                material_id: id,
                respuestas:  Object.entries(answers).map(([pregunta_id, respuesta]) => ({
                    pregunta_id,
                    respuesta
                })),
                tiempo_total_seg: elapsed
            })
            setResult(res.data)
        } catch(e) {
            console.error(e)
        } finally {
            setSubmitting(false)
        }
    }

    // ── FORMATEAR TIEMPO ───────────────────────────────────
    const formatTiempo = (seg) => {
        const m = Math.floor(seg / 60)
        const s = seg % 60
        return `${m}:${s.toString().padStart(2, "0")}`
    }

    // ── PANTALLA DE CARGA ──────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
            <div className="text-center text-gray-400">
                <div className="text-5xl mb-4 animate-bounce">📝</div>
                <p>Cargando preguntas...</p>
            </div>
        </div>
    )

    // ── SIN PREGUNTAS ──────────────────────────────────────
    if (preguntas.length === 0) return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
            <div className="text-center">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-gray-600 font-medium">
                    Este material no tiene preguntas de quiz aún.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                    El profesor debe agregar preguntas primero.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 text-purple-600 hover:underline font-medium"
                >
                    ← Volver
                </button>
            </div>
        </div>
    )

    // ── PANTALLA DE RESULTADO ──────────────────────────────
    if (result) return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 w-full max-w-md text-center">

                <div className="text-6xl mb-4">
                    {result.puntuacion >= 70 ? "🎉" : "📚"}
                </div>

                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Quiz completado
                </h2>

                {/* Puntuación grande */}
                <div className={`text-6xl font-bold my-6 ${
                    result.puntuacion >= 70
                    ? "text-green-500"
                    : "text-red-500"
                }`}>
                    {result.puntuacion}
                    <span className="text-2xl text-gray-400">/100</span>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-2xl font-bold text-gray-800">
                            {result.respuestas_correctas}
                        </p>
                        <p className="text-xs text-gray-500">Correctas</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-2xl font-bold text-gray-800">
                            {result.preguntas_total}
                        </p>
                        <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-2xl font-bold text-gray-800">
                            {formatTiempo(result.tiempo_total_seg || 0)}
                        </p>
                        <p className="text-xs text-gray-500">Tiempo</p>
                    </div>
                </div>

                {/* Mensaje según resultado */}
                <p className={`text-sm mb-6 ${
                    result.puntuacion >= 70
                    ? "text-green-600"
                    : "text-orange-600"
                }`}>
                    {result.puntuacion >= 90 && "¡Excelente! Dominas este tema."}
                    {result.puntuacion >= 70 && result.puntuacion < 90 && "¡Buen trabajo! Sigue practicando."}
                    {result.puntuacion < 70 && "Necesitas repasar este tema. ¡No te rindas!"}
                </p>

                {/* Botones */}
                <div className="space-y-3">
                    <button
                        onClick={() => {
                            setResult(null)
                            setAnswers({})
                            setCurrent(0)
                            setElapsed(0)
                        }}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600
                                   hover:from-purple-700 hover:to-blue-700 text-white rounded-xl
                                   font-semibold transition-all duration-200"
                    >
                        🔄 Intentar de nuevo
                    </button>
                    <button
                        onClick={() => navigate("/catalogo")}
                        className="w-full h-12 rounded-xl border-2 border-purple-200
                                   text-purple-600 hover:bg-purple-50 font-semibold
                                   transition-all duration-200"
                    >
                        ← Volver al catálogo
                    </button>
                </div>
            </div>
        </div>
    )

    // ── PREGUNTA ACTUAL ────────────────────────────────────
    const preg             = preguntas[current]
    const totalPreguntas   = preguntas.length
    const progreso         = ((current + 1) / totalPreguntas) * 100
    const todasRespondidas = Object.keys(answers).length === totalPreguntas

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
            <div className="max-w-2xl mx-auto">

                {/* ── HEADER ──────────────────────────────── */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                    >
                        ← Salir del quiz
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            ⏱️ {formatTiempo(elapsed)}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                            {current + 1} / {totalPreguntas}
                        </span>
                    </div>
                </div>

                {/* ── BARRA DE PROGRESO ────────────────────── */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progreso}%` }}
                    />
                </div>

                {/* ── TARJETA DE PREGUNTA ──────────────────── */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 mb-4">

                    {/* Tipo de pregunta */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            {preg.tipo === "multiple"  && "Selección múltiple"}
                            {preg.tipo === "truefalse" && "Verdadero / Falso"}
                            {preg.tipo === "fill"      && "Completar espacio"}
                        </span>
                        <span className="text-xs text-gray-400">
                            ⭐ {preg.puntos} puntos
                        </span>
                    </div>

                    {/* Texto de la pregunta */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                        {preg.texto}
                    </h2>

                    {/* ── OPCIONES SEGÚN TIPO ──────────────── */}

                    {/* TIPO: multiple */}
                    {preg.tipo === "multiple" && preg.opciones_json && (
                        <div className="space-y-3">
                            {preg.opciones_json.map((opcion, idx) => {
                                const letra   = ["A", "B", "C", "D"][idx]
                                const selected = answers[preg.id] === letra
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => selectAnswer(preg.id, letra)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                                            selected
                                            ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                                        }`}
                                    >
                                        <span className={`font-bold mr-3 ${
                                            selected ? "text-purple-600" : "text-gray-400"
                                        }`}>
                                            {letra}.
                                        </span>
                                        {opcion}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* TIPO: truefalse */}
                    {preg.tipo === "truefalse" && (
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "✅ Verdadero", value: "true"  },
                                { label: "❌ Falso",     value: "false" }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => selectAnswer(preg.id, opt.value)}
                                    className={`py-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                                        answers[preg.id] === opt.value
                                        ? "border-purple-500 bg-purple-50 text-purple-700"
                                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* TIPO: fill */}
                    {preg.tipo === "fill" && (
                        <input
                            type="text"
                            value={answers[preg.id] || ""}
                            onChange={e => selectAnswer(preg.id, e.target.value)}
                            placeholder="Escribe tu respuesta aquí..."
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                                       focus:outline-none focus:border-purple-400 focus:ring-2
                                       focus:ring-purple-400/20 text-gray-800"
                        />
                    )}
                </div>

                {/* ── NAVEGACIÓN ENTRE PREGUNTAS ───────────── */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setCurrent(c => Math.max(0, c - 1))}
                        disabled={current === 0}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600
                                   hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-colors font-medium text-sm"
                    >
                        ← Anterior
                    </button>

                    {/* Indicadores de preguntas */}
                    <div className="flex gap-2">
                        {preguntas.map((p, idx) => (
                            <button
                                key={p.id}
                                onClick={() => setCurrent(idx)}
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                                    idx === current
                                    ? "bg-purple-600 text-white"
                                    : answers[p.id]
                                    ? "bg-green-100 text-green-700 border border-green-300"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    {current < totalPreguntas - 1 ? (
                        <button
                            onClick={() => setCurrent(c => c + 1)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600
                                       hover:from-purple-700 hover:to-blue-700 text-white
                                       font-medium text-sm transition-all duration-200"
                        >
                            Siguiente →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!todasRespondidas || submitting}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500
                                       hover:from-green-600 hover:to-emerald-600 text-white
                                       font-medium text-sm transition-all duration-200
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Enviando..." : "✅ Enviar quiz"}
                        </button>
                    )}
                </div>

                {/* Aviso si faltan preguntas */}
                {current === totalPreguntas - 1 && !todasRespondidas && (
                    <p className="text-center text-sm text-orange-500 mt-3">
                        ⚠️ Responde todas las preguntas antes de enviar
                        ({Object.keys(answers).length}/{totalPreguntas} respondidas)
                    </p>
                )}

            </div>
        </div>
    )
}