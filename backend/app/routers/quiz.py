from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.quiz import QuizQuestion, TipoPreguntaEnum
from app.models.progress import QuizResult, QuizErrorDetail, TipoErrorEnum
from app.models.ai import UserSkillScore, HabilidadEnum, TendenciaEnum
from app.models.content import Material
from app.schemas.progress import (
    QuizSubmit, QuizResultOut,
    QuestionCreate, QuestionOut, QuestionOutWithAnswer
)
from app.core.dependencies import get_current_student, get_current_teacher, get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/quiz", tags=["Quiz"])


# ── ENDPOINT 1 — GET /quiz/{material_id}/questions ─────────────
# Devuelve preguntas SIN respuesta correcta — para el estudiante
@router.get("/{material_id}/questions", response_model=List[QuestionOut])
def get_questions(
    material_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Devuelve las preguntas del quiz sin revelar las respuestas correctas."""
    return db.query(QuizQuestion).filter(
        QuizQuestion.material_id == material_id
    ).order_by(QuizQuestion.orden).all()


# ── ENDPOINT 2 — GET /quiz/{material_id}/questions/answers ──────
# Devuelve preguntas CON respuesta correcta — solo profesores
@router.get("/{material_id}/questions/answers",
            response_model=List[QuestionOutWithAnswer])
def get_questions_with_answers(
    material_id: UUID,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher)
):
    """Devuelve las preguntas con respuestas correctas. Solo profesores."""
    return db.query(QuizQuestion).filter(
        QuizQuestion.material_id == material_id
    ).order_by(QuizQuestion.orden).all()


# ── ENDPOINT 3 — POST /quiz/{material_id}/questions ─────────────
# Crear una pregunta nueva — solo profesores
@router.post("/{material_id}/questions",
             response_model=QuestionOutWithAnswer,
             status_code=201)
def create_question(
    material_id: UUID,
    data: QuestionCreate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher)
):
    """Crea una nueva pregunta para el quiz. Solo profesores."""

    # Verificar que el material existe
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(404, "Material no encontrado")

    # Crear la pregunta
    q = QuizQuestion(
        id                 = uuid.uuid4(),
        material_id        = material_id,
        texto              = data.texto,
        tipo               = TipoPreguntaEnum(data.tipo),
        opciones_json      = data.opciones_json,
        respuesta_correcta = data.respuesta_correcta,
        explicacion        = data.explicacion,
        orden              = data.orden or 1,
        puntos             = data.puntos or 10
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


# ── ENDPOINT 4 — POST /quiz/{material_id}/submit ────────────────
# Enviar respuestas y calcular puntuación real
@router.post("/{material_id}/submit", response_model=QuizResultOut)
def submit_quiz(
    material_id: UUID,
    data: QuizSubmit,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    """
    Recibe respuestas del estudiante, las compara con las correctas
    de la BD y devuelve la puntuación real.
    """

    # ── PASO 1 — Obtener preguntas del quiz ───────────────────
    preguntas = db.query(QuizQuestion).filter(
        QuizQuestion.material_id == material_id
    ).all()

    if not preguntas:
        raise HTTPException(404, "Este material no tiene preguntas de quiz")

    # ── PASO 2 — Crear mapa de preguntas por ID ───────────────
    preg_map = {str(p.id): p for p in preguntas}
    total    = len(preguntas)
    correctas = 0
    falladas  = []

    # ── PASO 3 — Comparar cada respuesta ─────────────────────
    for resp in data.respuestas:
        preg = preg_map.get(resp.pregunta_id)
        if preg and resp.respuesta.strip().upper() == preg.respuesta_correcta.strip().upper():
            correctas += 1
        else:
            falladas.append(resp.pregunta_id)

    # ── PASO 4 — Calcular puntuación ──────────────────────────
    puntuacion = round((correctas / total) * 100, 2) if total > 0 else 0

    # ── PASO 5 — Guardar resultado ────────────────────────────
    result = QuizResult(
        id                   = uuid.uuid4(),
        user_id              = student.id,
        material_id          = material_id,
        puntuacion           = puntuacion,
        preguntas_total      = total,
        respuestas_correctas = correctas,
        tiempo_total_seg     = data.tiempo_total_seg,
        intento_numero       = 1
    )
    db.add(result)
    db.flush()

    # ── PASO 6 — Guardar errores si los hay ───────────────────
    if falladas:
        db.add(QuizErrorDetail(
            id             = uuid.uuid4(),
            quiz_result_id = result.id,
            tipo_error     = TipoErrorEnum.vocabulario,
            frecuencia     = len(falladas),
            ejemplos_json  = {"preguntas_falladas": falladas}
        ))

    # ── PASO 7 — Actualizar habilidad del estudiante ──────────
    skill = db.query(UserSkillScore).filter(
        UserSkillScore.user_id   == student.id,
        UserSkillScore.habilidad == HabilidadEnum.vocabulary
    ).first()

    if skill:
        # Promedio entre score actual y nueva puntuación
        skill.score              = round((skill.score + puntuacion) / 2, 2)
        skill.total_evaluaciones += 1
    else:
        # Crear el registro de habilidad si no existe
        db.add(UserSkillScore(
            id                 = uuid.uuid4(),
            user_id            = student.id,
            habilidad          = HabilidadEnum.vocabulary,
            score              = puntuacion,
            total_evaluaciones = 1
        ))

    db.commit()
    db.refresh(result)
    return result