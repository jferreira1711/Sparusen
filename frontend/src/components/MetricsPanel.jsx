import { useState, useEffect } from "react"
import { evaluateRecommendations, getCacheStatus } from "../services/api"

function MetricBar({ label, value, color = "bg-primary" }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-primary">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-4">
        <div 
          className={`${color} h-4 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function MetricsPanel({ k = 5 }) {
  const [evalData, setEvalData] = useState(null)
  const [globalData, setGlobalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      evaluateRecommendations(k),
      getCacheStatus()
    ])
      .then(([evalRes, globalRes]) => {
        setEvalData(evalRes.data)
        setGlobalData(globalRes.data)
      })
      .catch(e => setError(e.response?.data?.error || "Error al cargar métricas"))
      .finally(() => setLoading(false))
  }, [k])

  if (loading) return (
    <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48 mb-4"/>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"/>
      <div className="h-4 bg-gray-200 rounded w-3/4"/>
    </div>
  )

  if (error) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
      {error}
    </div>
  )

  const NIVEL_COLOR = {
    nuevo: "bg-gray-100 text-gray-600",
    activo: "bg-blue-100 text-blue-700",
    regular: "bg-teal-100 text-teal-700",
    experto: "bg-purple-100 text-purple-700",
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-primary-dark">Rendimiento del Motor IA</h3>
        {evalData?.nivel_usuario && (
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${NIVEL_COLOR[evalData.nivel_usuario]}`}>
            Nivel: {evalData.nivel_usuario} ({evalData.materiales_completados} materiales)
          </span>
        )}
      </div>

      {evalData && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            Algoritmo activo: <span className="font-medium text-gray-600">{evalData.algoritmo_activo}</span>
            {" | "} Evaluando top-{k} recomendaciones
          </p>
          <MetricBar 
            label={`Precision@${k}`} 
            value={evalData[`precision_at_${k}`]} 
            color="bg-primary" 
          />
          <MetricBar 
            label={`Recall@${k}`} 
            value={evalData[`recall_at_${k}`]} 
            color="bg-teal-500" 
          />
          <MetricBar 
            label={`F1 Score@${k}`} 
            value={evalData[`f1_at_${k}`]} 
            color="bg-purple-500" 
          />
          {globalData && (
            <MetricBar 
              label="Tasa de aceptación" 
              value={globalData.tasa_aceptacion_pct / 100} 
              color="bg-green-500" 
            />
          )}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
            <p>{evalData.interpretacion?.precision}</p>
            <p>{evalData.interpretacion?.recall}</p>
          </div>
        </>
      )}
    </div>
  )
}