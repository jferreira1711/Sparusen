from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ClassCreate(BaseModel):
    student_id:        UUID
    fecha_hora_inicio: datetime
    tema_clase:        Optional[str] = None
    duracion_minutos:  Optional[int] = 60

class ClassOut(BaseModel):
    id:                UUID
    teacher_id:        UUID
    student_id:        UUID
    fecha_hora_inicio: datetime
    fecha_hora_fin:    Optional[datetime] = None
    duracion_minutos:  Optional[int]      = None
    estado:            str
    url_sala:          Optional[str]      = None
    tema_clase:        Optional[str]      = None
    valoracion_alumno: Optional[int]      = None
    class Config: from_attributes = True