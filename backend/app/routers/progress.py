from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.progress import LearningLog
from app.models.user import User
from app.schemas.progress import ProgressCreate, ProgressOut, SkillScoreOut
from app.core.dependencies import get_current_user, get_current_student
import uuid
from app.services.recommender import invalidate_user_cache


router = APIRouter(prefix="/progress", tags=["Progreso"])


@router.post("", response_model=ProgressOut, status_code=201)
def register_progress(
    data: ProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """
    Registra o actualiza la interacción del estudiante con un material.
    Si ya existe un registro para ese material, lo actualiza.
    Si no existe, crea uno nuevo.
    """
    # Buscar si ya existe un registro para ese material
    existing = db.query(LearningLog).filter(
        LearningLog.user_id    == current_user.id,
        LearningLog.material_id == data.material_id
    ).first()

    if existing:
        # Actualizar el registro existente
        existing.tiempo_segundos  += data.tiempo_segundos or 0
        existing.completitud_pct   = max(existing.completitud_pct, data.completitud_pct or 0)
        existing.completado        = data.completado or existing.completado
        existing.intentos         += 1
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Crear nuevo registro
        log = LearningLog(
            id               = uuid.uuid4(),
            user_id          = current_user.id,
            material_id      = data.material_id,
            tiempo_segundos  = data.tiempo_segundos or 0,
            completitud_pct  = data.completitud_pct or 0.0,
            completado       = data.completado or False,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        invalidate_user_cache(str(current_user.id))
        return log


@router.get("/me", response_model=List[ProgressOut])
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Retorna todo el historial de progreso del estudiante."""
    return db.query(LearningLog).filter(
        LearningLog.user_id == current_user.id
    ).order_by(LearningLog.registrado_en.desc()).all()


@router.get("/skills", response_model=List[SkillScoreOut])
def get_my_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Retorna las puntuaciones actuales por habilidad del estudiante."""
    from app.models.ai import UserSkillScore
    return db.query(UserSkillScore).filter(
        UserSkillScore.user_id == current_user.id
    ).all()