import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProgress } from "../services/api";

export default function MiProgreso() {
  const [progreso, setProgreso] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyProgress()
      .then((r) => setProgreso(r.data))
      .catch(() => setProgreso([]))
      .finally(() => setLoading(false));
  }, []);

  const totalMinutos = Math.floor(
    progreso.reduce((acc, p) => acc + (p.tiempo_segundos || 0), 0) / 60
  );
  const completados = progreso.filter((p) => p.completado).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-dark text-white px-6 py-4 flex justify-between items-center shadow">
        <span className="text-xl font-bold">🎬 Plataforma Idiomas</span>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm underline opacity-80"
        >
          ← Dashboard
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-primary-dark mb-6">
          Mi Progreso 🎬
        </h1>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: "🎬", label: "Materiales vistos", value: progreso.length },
            { icon: "✅", label: "Materiales completados", value: completados },
            { icon: "🎬", label: "Minutos de estudio", value: totalMinutos },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow p-5 text-center"
            >
              <div className="text-3xl mb-1">{card.icon}</div>
              <div className="text-2xl font-bold text-primary-dark">
                {card.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Lista de historial */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">
              Historial de actividad
            </h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">🎬 Cargando...</div>
          ) : progreso.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <p className="text-4xl mb-2">🎬</p>
              <p>Aún no has visto ningún material.</p>
              <button
                onClick={() => navigate("/catalogo")}
                className="mt-4 text-primary underline text-sm"
              >
                Ir al catálogo →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {progreso.map((p) => (
                <li
                  key={p.id}
                  className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/material/${p.material_id}`)}
                >
                  <div>
                    <p className="text-sm text-gray-400">
                      ID: {p.material_id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {Math.floor(p.tiempo_segundos / 60)} min •{" "}
                      {Math.round(p.completitud_pct)}% completado
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      p.completado
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {p.completado ? "✅ Completado" : "🎬 En progreso"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}