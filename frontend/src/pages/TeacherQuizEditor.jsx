import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { createQuestion } from "../services/api"

const TIPOS = ["multiple", "truefalse", "fill"]

export default function TeacherQuizEditor() {

    const { materialId } = useParams()
    const navigate       = useNavigate()

    const [saved,   setSaved]   = useState([])
    const [saving,  setSaving]  = useState(false)
    const [form,    setForm]    = useState({
        texto:              "",
        tipo:               "multiple",
        opcion_a:           "",
        opcion_b:           "",
        opcion_c:           "",
        opcion_d:           "",
        respuesta_correcta: "A",
        explicacion:        "",
        orden:              1,
        puntos:             10
    })

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const opciones = form.tipo === "multiple"
                ? [form.opcion_a, form.opcion_b, form.opcion_c, form.opcion_d]
                : form.tipo === "truefalse"
                ? ["Verdadero", "Falso"]
                : null

            const res = await createQuestion(materialId, {
                material_id:        materialId,
                texto:              form.texto,
                tipo:               form.tipo,
                opciones_json:      opciones,
                respuesta_correcta: form.respuesta_correcta,
                explicacion:        form.explicacion,
                orden:              saved.length + 1,
                puntos:             form.puntos
            })

            setSaved(s => [...s, res.data])
            setForm(f => ({
                ...f,
                texto:      "",
                opcion_a:   "",
                opcion_b:   "",
                opcion_c:   "",
                opcion_d:   "",
                explicacion: ""
            }))
        } catch(err) {
            alert(err.response?.data?.detail || "Error al guardar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">

            {/* NAVBAR */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">PI</span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Editor de Quiz
                    </span>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                    ← Volver
                </button>
            </nav>

            <main className="max-w-2xl mx-auto px-6 py-8">

                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                    Crear preguntas
                </h1>
                <p className="text-gray-400 text-sm mb-6">
                    Material ID: {materialId}
                </p>

                {/* Preguntas guardadas */}
                {saved.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <p className="font-medium text-green-700 mb-2">
                            ✅ {saved.length} pregunta(s) guardada(s)
                        </p>
                        {saved.map((q, i) => (
                            <p key={i} className="text-sm text-gray-600">
                                • {q.texto}
                            </p>
                        ))}
                    </div>
                )}

                {/* Formulario */}
                <form
                    onSubmit={handleSave}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100"
                >

                    {/* Tipo de pregunta */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                            Tipo de pregunta
                        </label>
                        <div className="flex gap-2">
                            {TIPOS.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm(f => ({...f, tipo: t}))}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                        form.tipo === t
                                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {t === "multiple"  && "Múltiple"}
                                    {t === "truefalse" && "V / F"}
                                    {t === "fill"      && "Completar"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Texto de la pregunta */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Pregunta
                        </label>
                        <textarea
                            value={form.texto}
                            onChange={e => setForm(f => ({...f, texto: e.target.value}))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-20
                                       focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                       focus:border-purple-400"
                            placeholder="¿Cuál es el pasado de go?"
                            required
                        />
                    </div>

                    {/* Opciones — solo para multiple */}
                    {form.tipo === "multiple" && (
                        <div className="grid grid-cols-2 gap-3">
                            {["a", "b", "c", "d"].map(l => (
                                <div key={l}>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">
                                        Opción {l.toUpperCase()}
                                    </label>
                                    <input
                                        value={form[`opcion_${l}`]}
                                        onChange={e => setForm(f => ({...f, [`opcion_${l}`]: e.target.value}))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                                                   focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                                   focus:border-purple-400"
                                        placeholder={`Opción ${l.toUpperCase()}`}
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Respuesta correcta */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Respuesta correcta
                        </label>
                        <input
                            value={form.respuesta_correcta}
                            onChange={e => setForm(f => ({...f, respuesta_correcta: e.target.value}))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                       focus:border-purple-400"
                            placeholder={
                                form.tipo === "multiple"  ? "A, B, C o D" :
                                form.tipo === "truefalse" ? "true o false" :
                                "la respuesta exacta"
                            }
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {form.tipo === "multiple"  && "Escribe la letra: A, B, C o D"}
                            {form.tipo === "truefalse" && "Escribe: true o false"}
                            {form.tipo === "fill"      && "Escribe la palabra exacta que debe completar el espacio"}
                        </p>
                    </div>

                    {/* Explicación */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Explicación (opcional)
                        </label>
                        <input
                            value={form.explicacion}
                            onChange={e => setForm(f => ({...f, explicacion: e.target.value}))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                       focus:border-purple-400"
                            placeholder="Porque went es el pasado irregular de go"
                        />
                    </div>

                    {/* Puntos */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                            Puntos
                        </label>
                        <input
                            type="number"
                            value={form.puntos}
                            onChange={e => setForm(f => ({...f, puntos: parseInt(e.target.value)}))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-purple-400/20
                                       focus:border-purple-400"
                            min="1"
                        />
                    </div>

                    {/* Botón guardar */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600
                                   hover:from-purple-700 hover:to-blue-700 text-white rounded-xl
                                   font-semibold transition-all duration-200 disabled:opacity-50"
                    >
                        {saving ? "Guardando..." : "Guardar pregunta →"}
                    </button>
                </form>

            </main>
        </div>
    )
}