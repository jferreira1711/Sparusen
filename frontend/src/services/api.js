import axios from "axios"

// URL base de la API
const API_URL = "http://localhost:8000"

const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
})

// Interceptor — agrega el token JWT automáticamente a cada petición
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// ── Autenticación ─────────────────────────────────────────
export const registerUser = (data) => api.post("/auth/register", data)
export const loginUser    = (data) => api.post("/auth/login", data)

// ── Contenido ─────────────────────────────────────────────
export const getLevels    = ()          => api.get("/levels")
export const getMaterials = (params={}) => api.get("/materials", { params })
export const getMaterial  = (id)        => api.get(`/materials/${id}`)

// ── Progreso ──────────────────────────────────────────────
export const registerProgress = (data) => api.post("/progress", data)
export const getMyProgress    = ()     => api.get("/progress/me")
export const getMySkills      = ()     => api.get("/progress/skills")

// ── Quiz ──────────────────────────────────────────────────
export const submitQuiz = (materialId, data) =>
    api.post(`/quiz/${materialId}/submit`, data)

// ── Endpoints de clases ───────────────────────────────────────
export const getClasses  = ()     => api.get("/classes")
export const createClass = (data) => api.post("/classes", data)
export const getClass    = (id)   => api.get(`/classes/${id}`)
export const joinClass   = (id)   => api.post(`/classes/${id}/join`)
export const endClass    = (id)   => api.post(`/classes/${id}/end`)

// ── Endpoints de preguntas de quiz ────────────────────────────
export const getQuestions   = (materialId)       => api.get(`/quiz/${materialId}/questions`)
export const createQuestion = (materialId, data) => api.post(`/quiz/${materialId}/questions`, data)

// Export default siempre al final
export default api

// Recomendaciones ML
export const getRecommendations = (topN=5) => api.get(`/recommendations?top_n=${topN}`)
export const acceptRecommendation = (id) => api.post(`/recommendations/${id}/accept`)
export const rejectRecommendation = (id) => api.post(`/recommendations/${id}/reject`)
export const getRecommendationMetrics = () => api.get("/recommendations/metrics")

// === FASE 5 — Metricas avanzadas ===
export const evaluateRecommendations = (k=5) => api.get(`/recommendations/evaluate?k=${k}`)
export const getCacheStatus = () => api.get("/recommendations/cache/status")
