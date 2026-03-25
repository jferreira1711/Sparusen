from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.classroom import LiveSession, EstadoSesionEnum
from app.schemas.classroom import ClassCreate, ClassOut
from app.core.dependencies import get_current_user, get_current_teacher
from app.models.user import User
import uuid

router = APIRouter(prefix="/classes", tags=["Clases en vivo"])


# ── ENDPOINT 1 — GET /classes ───────────────────────────────────
@router.get("", response_model=List[ClassOut])
def get_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todas las clases del usuario actual según su rol."""
    if current_user.rol.value == "teacher":
        return db.query(LiveSession).filter(
            LiveSession.teacher_id == current_user.id
        ).order_by(LiveSession.fecha_hora_inicio.desc()).all()
    else:
        return db.query(LiveSession).filter(
            LiveSession.student_id == current_user.id
        ).order_by(LiveSession.fecha_hora_inicio.desc()).all()


# ── ENDPOINT 2 — POST /classes ──────────────────────────────────
@router.post("", response_model=ClassOut, status_code=201)
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher)
):
    """Crea una nueva sesión de clase. Solo profesores."""
    session = LiveSession(
        id                = uuid.uuid4(),
        teacher_id        = teacher.id,
        student_id        = data.student_id,
        fecha_hora_inicio = data.fecha_hora_inicio,
        duracion_minutos  = data.duracion_minutos,
        tema_clase        = data.tema_clase,
        estado            = EstadoSesionEnum.programada
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# ── ENDPOINT 3 — GET /classes/{id} ─────────────────────────────
@router.get("/{class_id}", response_model=ClassOut)
def get_class(
    class_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Devuelve el detalle de una clase específica."""
    cls = db.query(LiveSession).filter(LiveSession.id == class_id).first()
    if not cls:
        raise HTTPException(404, "Clase no encontrada")
    return cls


# ── ENDPOINT 4 — POST /classes/{id}/join ───────────────────────
@router.post("/{class_id}/join", response_model=ClassOut)
def join_class(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marca la clase como en curso y genera la URL de la sala."""
    cls = db.query(LiveSession).filter(LiveSession.id == class_id).first()
    if not cls:
        raise HTTPException(404, "Clase no encontrada")

    cls.estado   = EstadoSesionEnum.en_curso
    cls.url_sala = f"https://meet.plataforma.local/room/{class_id}"
    db.commit()
    db.refresh(cls)
    return cls


# ── ENDPOINT 5 — POST /classes/{id}/end ────────────────────────
@router.post("/{class_id}/end", response_model=ClassOut)
def end_class(
    class_id: UUID,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher)
):
    """Finaliza la clase y guarda la hora de fin. Solo profesores."""
    cls = db.query(LiveSession).filter(LiveSession.id == class_id).first()
    if not cls:
        raise HTTPException(404, "Clase no encontrada")

    cls.estado          = EstadoSesionEnum.finalizada
    cls.fecha_hora_fin  = datetime.utcnow()
    db.commit()
    db.refresh(cls)
    return cls