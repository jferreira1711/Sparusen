from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
# ── Schemas de entrada (lo que envía el cliente) ──────────────
class UserRegister(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol: str # "student", "teacher" o "admin"
    idioma_objetivo: Optional[str] = "inglés"
    idioma_nativo: Optional[str] = "español"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ── Schemas de salida (lo que devuelve la API) ────────────────
class UserOut(BaseModel):
    id: UUID
    nombre: str
    email: str
    rol: str
    activo: bool
    fecha_registro: Optional[datetime] = None
    class Config:
        from_attributes = True # Permite convertir objetos SQLAlchemy

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
