export default function RecommendationExplainer({ algoritmo, motivo, score, nivel_usuario }) {
  const configs = {
    "hybrid-cb": { 
      icono: "Historial", 
      color: "border-blue-200 bg-blue-50",
      texto_color: "text-blue-700" 
    },
    "hybrid-svd": { 
      icono: "Patrón IA", 
      color: "border-purple-200 bg-purple-50", 
      texto_color: "text-purple-700" 
    },
    "hybrid-col": { 
      icono: "Comunidad", 
      color: "border-teal-200 bg-teal-50",
      texto_color: "text-teal-700" 
    },
    "content-based": { 
      icono: "Contenido", 
      color: "border-gray-200 bg-gray-50",
      texto_color: "text-gray-700" 
    },
  }
  const cfg = configs[algoritmo] || configs["content-based"]
  const confianza = Math.round((score || 0) * 100)

  return (
    <div className={`border rounded-xl p-3 mt-2 ${cfg.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white ${cfg.texto_color}`}>
            {cfg.icono}
          </span>
          <p className={`text-xs ${cfg.texto_color}`}>{motivo}</p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold ${cfg.texto_color}`}>{confianza}%</span>
          <p className="text-xs text-gray-400">confianza</p>
        </div>
      </div>
      {nivel_usuario && (
        <p className="text-xs text-gray-400 mt-1">
          Modo: {algoritmo} | Tu nivel: {nivel_usuario}
        </p>
      )}
    </div>
  )
}