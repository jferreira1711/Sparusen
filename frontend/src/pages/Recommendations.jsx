import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getRecommendations, acceptRecommendation, rejectRecommendation } from "../services/api"
import MetricsPanel from "../components/MetricsPanel"
import RecommendationExplainer from "../components/RecommendationExplainer"

const TIPO_LABEL = { video: "Video", pdf: "PDF", quiz: "Quiz", audio: "Audio", ejercicio: "Ejercicio" }

export default function Recommendations() {
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [fb, setFb] = useState({})
  const [orden, setOrden] = useState("score") // "score" o "tipo"
  const [showPanel, setShowPanel] = useState(false)
  const navigate = useNavigate()

  const fetchRecs = () => {
    setLoading(true)
    getRecommendations(10)
      .then(r => setRecs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRecs() }, [])

  const handleAccept = async (rec) => {
    const res = await acceptRecommendation(rec.id)
    setFb(f => ({ ...f, [rec.id]: "accepted" }))
    setTimeout(() => navigate(`/material/${res.data.material_id}`), 400)
  }

  const handleReject = async (id) => {
    await rejectRecommendation(id)
    setFb(f => ({ ...f, [id]: "rejected" }))
  }

  const recsOrdenadas = [...recs].sort((a, b) => {
    if (orden === "tipo") return a.tipo.localeCompare(b.tipo)
    return b.score - a.score
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-dark text-white px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold">Plataforma Idiomas</span>
        <button onClick={() => navigate("/dashboard")} className="text-sm opacity-80 hover:opacity-100">
          Volver
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Para ti</h1>
            <p className="text-gray-500 text-sm mt-1">Recomendaciones personalizadas por IA</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPanel(s => !s)}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                showPanel
                  ? "bg-primary text-white border-primary"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Métricas
            </button>
            <button
              onClick={fetchRecs}
              className="text-sm border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary-light"
            >
              Actualizar
            </button>
          </div>
        </div>

        {showPanel && <MetricsPanel k={5} />}

        {recs.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Ordenar por:</span>
            {["score", "tipo"].map(o => (
              <button
                key={o}
                onClick={() => setOrden(o)}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  orden === o
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {o === "score" ? "Relevancia" : "Tipo"}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Calculando recomendaciones...</div>
        ) : recs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-3">Sin historial suficiente.</p>
            <button
              onClick={() => navigate("/catalog")}
              className="bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary-dark"
            >
              Ir al catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recsOrdenadas.map(rec => {
              const estado = fb[rec.id]
              return (
                <div
                  key={rec.id}
                  className={`bg-white rounded-2xl shadow p-5 transition-all ${
                    estado === "rejected" ? "opacity-30 scale-95" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {TIPO_LABEL[rec.tipo]}
                        </span>
                        <span className="font-semibold text-gray-800">{rec.titulo}</span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-primary ml-3 shrink-0">
                      {Math.round(rec.score * 100)}%
                    </span>
                  </div>

                  <RecommendationExplainer
                    algoritmo={rec.algoritmo}
                    motivo={rec.motivo}
                    score={rec.score}
                    nivel_usuario={rec.nivel_usuario}
                  />

                  <div className="mt-3">
                    {estado === "accepted" ? (
                      <p className="text-green-600 text-sm font-medium">Abriendo...</p>
                    ) : estado === "rejected" ? (
                      <p className="text-gray-400 text-sm">No me interesa</p>
                    ) : (
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleAccept(rec)}
                          className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-xl text-sm font-medium"
                        >
                          Ver material
                        </button>
                        <button
                          onClick={() => handleReject(rec.id)}
                          className="px-4 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50"
                        >
                          No me interesa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}