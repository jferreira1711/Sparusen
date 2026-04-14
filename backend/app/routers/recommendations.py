# backend/app/routers/recommendations.py
import time
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
from app.services.recommender import precision_at_k, recall_at_k, get_dynamic_weights
from app.models.progress import LearningLog

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


@router.get("/evaluate")
def evaluate_recommendations(
    k: int = Query(5, le=10, description="Evaluar top-K recomendaciones"),
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    """
    Calcula Precision@K y Recall@K para el usuario actual.
    Compara las recomendaciones guardadas con los materiales que
    efectivamente estudió el usuario después de recibirlas.
    """
    # 1. Obtener IDs de recomendaciones pasadas (ordenadas por fecha)
    recs_pasadas = db.query(AiRecommendation).filter(
        AiRecommendation.user_id == student.id
    ).order_by(AiRecommendation.generada_en.desc()).limit(20).all()

    if not recs_pasadas:
        return {
            "error": "No hay recomendaciones pasadas para evaluar",
            "sugerencia": "Genera recomendaciones desde GET /recommendations primero"
        }

    # 2. IDs de materiales recomendados
    recommended_ids = [str(r.material_id_rec) for r in recs_pasadas]

    # 3. IDs de materiales que el usuario realmente completó después
    logs_completados = db.query(LearningLog).filter(
        LearningLog.user_id == student.id,
        LearningLog.completado == True
    ).all()
    relevant_ids = [str(l.material_id) for l in logs_completados]

    if not relevant_ids:
        return {
            "error": "El usuario no ha completado ningún material todavía",
            "sugerencia": "Completa materiales del catálogo para poder evaluar"
        }

    # 4. Calcular métricas
    p_at_k = precision_at_k(recommended_ids, relevant_ids, k=k)
    r_at_k = recall_at_k(recommended_ids, relevant_ids, k=k)
    f1 = round(2 * p_at_k * r_at_k / (p_at_k + r_at_k), 4) if (p_at_k + r_at_k) > 0 else 0

    # 5. Info del nivel del usuario
    weights = get_dynamic_weights(str(student.id), db)

    # 6. Tasa de aceptación histórica (si se registra el campo aceptada)
    total_recs = len(recs_pasadas)
    aceptadas = sum(1 for r in recs_pasadas if getattr(r, 'aceptada', False) is True)

    return {
        "usuario": student.nombre,
        "nivel_usuario": weights["nivel"],
        "materiales_completados": weights["total"],
        "algoritmo_activo": "svd-hibrido" if weights["use_svd"] else "content-based",
        f"precision_at_{k}": p_at_k,
        f"recall_at_{k}": r_at_k,
        f"f1_at_{k}": f1,
        "total_recomendaciones_evaluadas": total_recs,
        "materiales_relevantes": len(relevant_ids),
        "tasa_aceptacion_pct": round(aceptadas / total_recs * 100, 2) if total_recs > 0 else 0,
        "interpretacion": {
            "precision": f"{round(p_at_k*100,1)}% de las top-{k} recomendaciones fueron relevantes",
            "recall": f"Se capturó el {round(r_at_k*100,1)}% de los materiales de interés del usuario"
        }
    }


@router.get("/cache/status")
def cache_status(_: User = Depends(get_current_student)):
    """
    Muestra el estado actual del cache de recomendaciones (solo para depuración).
    """
    from app.services.recommender import _cache, CACHE_TTL_SECONDS
    now = time.time()
    entradas = [
        {
            "key": k,
            "edad_segundos": round(now - v["timestamp"]),
            "expira_en": round(CACHE_TTL_SECONDS - (now - v["timestamp"]))
        }
        for k, v in _cache.items()
    ]
    return {
        "total_entradas_en_cache": len(_cache),
        "ttl_segundos": CACHE_TTL_SECONDS,
        "entradas": entradas
    }