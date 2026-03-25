from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from typing import Any

# ── Schemas de Progreso ───────────────────────────────────────
class ProgressCreate(BaseModel):
    material_id: UUID
    tiempo_segundos: Optional[int] = 0
    completitud_pct: Optional[float] = 0.0
    completado: Optional[bool] = False

class ProgressOut(BaseModel):
    id: UUID
    material_id: UUID
    tiempo_segundos: int
    completitud_pct: float
    completado: bool
    registrado_en: Optional[datetime] = None
    class Config: from_attributes = True

# ── Schemas de Quiz ───────────────────────────────────────────
class QuizAnswer(BaseModel):
    pregunta_id: int
    respuesta: str

class QuizSubmit(BaseModel):
    material_id: UUID
    respuestas: List[QuizAnswer]
    tiempo_total_seg: Optional[int] = None

class QuizResultOut(BaseModel):
    id: UUID
    puntuacion: float
    preguntas_total: int
    respuestas_correctas: int
    tiempo_total_seg: Optional[int] = None
    realizado_en: Optional[datetime] = None
    class Config: from_attributes = True

# ── Schema de Habilidades ─────────────────────────────────────
class SkillScoreOut(BaseModel):
    habilidad: str
    score: float
    tendencia: Optional[str] = None
    total_evaluaciones: int
    class Config: from_attributes = True

# ── Schemas de Preguntas ──────────────────────────────────────

class QuestionCreate(BaseModel):
    material_id:        UUID
    texto:              str
    tipo:               str            = "multiple"
    opciones_json:      Optional[list] = None
    respuesta_correcta: str
    explicacion:        Optional[str]  = None
    orden:              Optional[int]  = 1
    puntos:             Optional[int]  = 10

class QuestionOut(BaseModel):
    id:            UUID
    texto:         str
    tipo:          str
    opciones_json: Optional[Any] = None
    orden:         int
    puntos:        int
    class Config: from_attributes = True

class QuestionOutWithAnswer(QuestionOut):
    respuesta_correcta: str
    explicacion:        Optional[str] = None