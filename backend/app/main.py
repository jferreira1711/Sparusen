from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.routers import auth, users, materials, progress, quiz, classes
from app.services.socket_events import sio

# ── CREAR LA APLICACIÓN FASTAPI ────────────────────────────────
fastapi_app = FastAPI(
    title="Plataforma de Idiomas API",
    description="API REST para la plataforma educativa de lenguas extranjeras",
    version="3.0.0"
)

# ── CONFIGURAR CORS ────────────────────────────────────────────
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REGISTRAR ROUTERS ──────────────────────────────────────────
fastapi_app.include_router(auth.router)
fastapi_app.include_router(users.router)
fastapi_app.include_router(materials.router)
fastapi_app.include_router(progress.router)
fastapi_app.include_router(quiz.router)
fastapi_app.include_router(classes.router)

# ── ENDPOINT RAÍZ ─────────────────────────────────────────────
@fastapi_app.get("/", tags=["Sistema"])
def root():
    return {
        "status":    "ok",
        "version":   "3.0.0",
        "fase":      "Fase 3 — Clases y Quiz Real",
        "endpoints": [
            "/auth", "/users", "/levels", "/units",
            "/materials", "/progress", "/quiz", "/classes"
        ]
    }

# ── MONTAR SOCKET.IO SOBRE FASTAPI ─────────────────────────────
# IMPORTANTE: el objeto final se llama "app" no "fastapi_app"
# uvicorn necesita encontrar "app" en este archivo
app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app
)