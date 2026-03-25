from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
# ── Schemas de Niveles ────────────────────────────────────────
class LevelOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    orden: int
    class Config: from_attributes = True

# ── Schemas de Etiquetas ──────────────────────────────────────
class TagIn(BaseModel):
    tag_type: str # "habilidad", "nivel", "tema", "categoria", "contexto"
    tag_value: str

class TagOut(BaseModel):
    id: UUID
    tag_type: str
    tag_value: str
    class Config: from_attributes = True

# ── Schemas de Materiales ─────────────────────────────────────
class MaterialCreate(BaseModel):
    unit_id: UUID
    titulo: str
    tipo: str # "video", "pdf", "quiz", "audio", "ejercicio"
    url_recurso: str
    duracion_segundos: Optional[int] = None
    dificultad: Optional[int] = 1
    tags: Optional[List[TagIn]] = []

class MaterialUpdate(BaseModel):
    titulo: Optional[str] = None
    url_recurso: Optional[str] = None
    dificultad: Optional[int] = None
    tags: Optional[List[TagIn]] = None
class MaterialOut(BaseModel):
    id: UUID
    titulo: str
    tipo: str
    url_recurso: str
    duracion_segundos: Optional[int] = None
    dificultad: int
    vistas_totales: int
    rating_promedio: float
    creado_en: Optional[datetime] = None
    tags: List[TagOut] = []
    class Config: from_attributes = True