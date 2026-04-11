import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getRecommendations, acceptRecommendation, rejectRecommendation } from "../services/api"

const ICON = { video: "video", pdf: "PDF", quiz: "quiz", audio: "audio", ejercicio: "ejercicio" }

const ALGO = {
  "hybrid-cb": { label: "Basado en tu historial", color: "bg-blue-100 text-blue-700" },
  "hybrid-col": { label: "Estudiantes similares", color: "bg-purple-100 text-purple-700" },
  "content-based": { label: "Contenido similar", color: "bg-teal-100 text-teal-700" },
  "collaborative": { label: "Filtrado colaborativo", color: "bg-orange-100 text-orange-700" },
}

export default function Recommendations() {
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [fb, setFb] = useState({}) // estado local de feedback: { recId: "accepted"|"rejected" }
  const navigate = useNavigate()

  const fetchRecs = () => {
    setLoading(true)
    getRecommendations(5)
      .then(r => setRecs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRecs()
  }, [])

  const handleAccept = async (rec) => {
    const res = await acceptRecommendation(rec.id)
    setFb(f => ({ ...f, [rec.id]: "accepted" }))
    setTimeout(() => navigate(`/material/${res.data.material_id}`), 500)
  }

  const handleReject = async (id) => {
    await rejectRecommendation(id)
    setFb(f => ({ ...f, [id]: "rejected" }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-dark text-white px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold">Plataforma Idiomas</span>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm opacity-80 hover:opacity-100"
        >
          Volver al Dashboard
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Para ti</h1>
            <p className="text-gray-500 text-sm mt-1">Materiales recomendados por el motor de IA</p>
          </div>
          <button
            onClick={fetchRecs}
            className="text-sm border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary-light"
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">...</p>
            <p>Calculando recomendaciones...</p>
          </div>
        ) : recs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">Aún no hay suficiente historial.</p>
            <p className="text-gray-400 text-sm">Completa materiales del catálogo primero.</p>
            <button
              onClick={() => navigate("/catalog")}
              className="mt-4 bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary-dark"
            >
              Ir al catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recs.map(rec => {
              const estado = fb[rec.id]
              const algo = ALGO[rec.algoritmo] || ALGO["hybrid-cb"]
              return (
                <div
                  key={rec.id}
                  className={`bg-white rounded-2xl shadow p-5 transition-all ${
                    estado === "rejected" ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-800">{rec.titulo}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${algo.color}`}>
                          {algo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{rec.motivo}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-xl font-bold text-primary">{Math.round(rec.score * 100)}%</div>
                      <div className="text-xs text-gray-400">relevancia</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.round(rec.score * 100)}%` }}
                    />
                  </div>

                  {estado === "accepted" ? (
                    <p className="text-green-600 text-sm font-medium">Abriendo material...</p>
                  ) : estado === "rejected" ? (
                    <p className="text-gray-400 text-sm">No me interesa</p>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAccept(rec)}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-xl text-sm font-medium"
                      >
                        Ver material
                      </button>
                      <button
                        onClick={() => handleReject(rec.id)}
                        className="px-4 py-2 border border-gray-300 text-gray-500 rounded-xl text-sm hover:bg-gray-50"
                      >
                        No me interesa
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}