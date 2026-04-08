from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.services.socket_events import sio
from app.routers import auth, users, materials, progress, quiz, classes, recommendations

fastapi_app = FastAPI(
    title="Plataforma de Idiomas API",
    description="API REST para la plataforma educativa de lenguas extranjeras",
    version="4.0.0"
)

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

fastapi_app.include_router(auth.router)
fastapi_app.include_router(users.router)
fastapi_app.include_router(materials.router)
fastapi_app.include_router(progress.router)
fastapi_app.include_router(quiz.router)
fastapi_app.include_router(classes.router)
fastapi_app.include_router(recommendations.router)

@fastapi_app.get("/", tags=["Sistema"])
def root():
    return {
        "status":  "ok",
        "version": "4.0.0",
        "fase":    "Fase 4 — Motor ML Recomendaciones"
    }

app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

