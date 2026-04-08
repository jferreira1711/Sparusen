# backend/app/routers/recommendations.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from app.database import get_db
from app.models.ai import AiRecommendation
from app.core.dependencies import get_current_student, get_current_user
from app.models.user import User
from app.services.recommender import hybrid_recommendations
import uuid

router = APIRouter(prefix="/recommendations", tags=["Recomendaciones IA"])

class RecommendationOut(BaseModel):
    id: UUID
    material_id: UUID
    titulo: str
    tipo: str
    score: float
    motivo: str
    algoritmo: str
    aceptada: Optional[bool] = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[RecommendationOut])
def get_recommendations(
    top_n: int = Query(5, le=10),
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    """
    Obtiene recomendaciones híbridas para el estudiante autenticado.
    Cada recomendación se guarda en la tabla AiRecommendation para seguimiento.
    """
    recs = hybrid_recommendations(str(student.id), db, top_n=top_n)
    if not recs:
        return []

    saved = []
    for rec in recs:
        ai_rec = AiRecommendation(
            id=uuid.uuid4(),
            user_id=student.id,
            material_id_rec=rec["material_id"],
            motivo=rec["motivo"],
            score_confianza=rec["score"],
            algoritmo_usado=rec["algoritmo"],
            aceptada=None
        )
        db.add(ai_rec)
        db.flush()  # para obtener el id generado
        saved.append({
            "id": str(ai_rec.id),
            "material_id": rec["material_id"],
            "titulo": rec["titulo"],
            "tipo": rec["tipo"],
            "score": rec["score"],
            "motivo": rec["motivo"],
            "algoritmo": rec["algoritmo"],
            "aceptada": None
        })
    db.commit()
    return saved

@router.post("/{rec_id}/accept")
def accept_recommendation(
    rec_id: UUID,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    """Marca una recomendación como aceptada (útil para el estudiante)."""
    rec = db.query(AiRecommendation).filter(
        AiRecommendation.id == rec_id,
        AiRecommendation.user_id == student.id
    ).first()
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    rec.aceptada = True
    db.commit()
    return {"message": "Aceptada", "material_id": str(rec.material_id_rec)}

@router.post("/{rec_id}/reject")
def reject_recommendation(
    rec_id: UUID,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    """Marca una recomendación como rechazada (no fue útil)."""
    rec = db.query(AiRecommendation).filter(
        AiRecommendation.id == rec_id,
        AiRecommendation.user_id == student.id
    ).first()
    if not rec:
        raise HTTPException(404, "Recomendación no encontrada")
    rec.aceptada = False
    db.commit()
    return {"message": "Rechazada"}

@router.get("/metrics")
def get_metrics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)   # solo administradores o cualquier usuario autenticado
):
    """Devuelve estadísticas globales de aceptación/rechazo de recomendaciones."""
    total = db.query(AiRecommendation).count()
    aceptadas = db.query(AiRecommendation).filter(AiRecommendation.aceptada == True).count()
    rechazadas = db.query(AiRecommendation).filter(AiRecommendation.aceptada == False).count()
    return {
        "total": total,
        "aceptadas": aceptadas,
        "rechazadas": rechazadas,
        "tasa_aceptacion_pct": round(aceptadas / total * 100, 2) if total > 0 else 0
    }