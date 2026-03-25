from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.content import LearningLevel, Unit, Material, ContentTag
from app.models.content import TipoMaterialEnum, TagTypeEnum
from app.schemas.content import LevelOut, MaterialCreate, MaterialUpdate, MaterialOut
from app.core.dependencies import get_current_user, get_current_teacher
from app.models.user import User
import uuid

router = APIRouter(tags=["Contenido"])


# ══════════════════════════════════════════════════════════════
# SECCIÓN 1 — NIVELES MCER
# ══════════════════════════════════════════════════════════════

@router.get("/levels", response_model=List[LevelOut])
def get_levels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista los 6 niveles MCER disponibles ordenados de A1 a C2."""
    return db.query(LearningLevel).order_by(LearningLevel.orden).all()


# ══════════════════════════════════════════════════════════════
# SECCIÓN 2 — UNIDADES
# ══════════════════════════════════════════════════════════════

@router.get("/units")
def get_units(
    level_id: Optional[int] = Query(None, description="Filtrar por nivel MCER"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista unidades con filtro opcional por nivel."""
    query = db.query(Unit).filter(Unit.publicada == True)
    if level_id:
        query = query.filter(Unit.level_id == level_id)
    return query.order_by(Unit.orden).all()


# ══════════════════════════════════════════════════════════════
# SECCIÓN 3 — MATERIALES
# ══════════════════════════════════════════════════════════════

@router.get("/materials", response_model=List[MaterialOut])
def get_materials(
    nivel: Optional[str] = Query(None, description="Filtrar por nivel: A1, A2, B1..."),
    tipo:  Optional[str] = Query(None, description="video, pdf, quiz, audio, ejercicio"),
    tema:  Optional[str] = Query(None, description="Filtrar por tema del contenido"),
    skip:  int           = Query(0,    description="Paginación — cuántos saltar"),
    limit: int           = Query(20,   description="Paginación — cuántos mostrar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista materiales con filtros opcionales por nivel, tipo y tema."""
    query = db.query(Material)

    if tipo:
        try:
            query = query.filter(Material.tipo == TipoMaterialEnum(tipo))
        except ValueError:
            raise HTTPException(400, f"Tipo inválido: {tipo}")

    if nivel:
        query = query.join(Material.tags).filter(
            ContentTag.tag_type == TagTypeEnum.nivel,
            ContentTag.tag_value == nivel
        )

    if tema:
        query = query.join(Material.tags).filter(
            ContentTag.tag_type == TagTypeEnum.tema,
            ContentTag.tag_value.ilike(f"%{tema}%")
        )

    return query.offset(skip).limit(limit).all()


@router.get("/materials/{material_id}", response_model=MaterialOut)
def get_material(
    material_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna el detalle completo de un material con sus etiquetas."""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Material no encontrado")

    # Incrementar vistas cada vez que se consulta el detalle
    material.vistas_totales += 1
    db.commit()
    db.refresh(material)
    return material


@router.post("/materials", response_model=MaterialOut, status_code=201)
def create_material(
    data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Crea un nuevo material educativo. Solo profesores."""

    # Verificar que la unidad existe
    unit = db.query(Unit).filter(Unit.id == data.unit_id).first()
    if not unit:
        raise HTTPException(404, "Unidad no encontrada")

    # Crear el material
    material = Material(
        id                = uuid.uuid4(),
        unit_id           = data.unit_id,
        titulo            = data.titulo,
        tipo              = TipoMaterialEnum(data.tipo),
        url_recurso       = data.url_recurso,
        duracion_segundos = data.duracion_segundos,
        dificultad        = data.dificultad or 1,
    )
    db.add(material)
    db.flush()  # genera el id sin hacer commit todavía

    # Agregar etiquetas
    for tag in (data.tags or []):
        db.add(ContentTag(
            id          = uuid.uuid4(),
            material_id = material.id,
            tag_type    = TagTypeEnum(tag.tag_type),
            tag_value   = tag.tag_value
        ))

    db.commit()
    db.refresh(material)
    return material


@router.put("/materials/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: UUID,
    data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Edita un material existente."""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Material no encontrado")

    # Actualizar solo los campos que llegaron
    if data.titulo:      material.titulo      = data.titulo
    if data.url_recurso: material.url_recurso = data.url_recurso
    if data.dificultad:  material.dificultad  = data.dificultad

    # Si llegaron tags nuevas → borrar las viejas y poner las nuevas
    if data.tags is not None:
        db.query(ContentTag).filter(
            ContentTag.material_id == material_id
        ).delete()
        for tag in data.tags:
            db.add(ContentTag(
                id          = uuid.uuid4(),
                material_id = material.id,
                tag_type    = TagTypeEnum(tag.tag_type),
                tag_value   = tag.tag_value
            ))

    db.commit()
    db.refresh(material)
    return material


@router.delete("/materials/{material_id}", status_code=204)
def delete_material(
    material_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """Elimina un material y todos sus registros relacionados. Solo profesores."""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Material no encontrado")

    # Paso 1 — borrar errores de quiz relacionados
    from app.models.progress import QuizResult, QuizErrorDetail, LearningLog
    quiz_results = db.query(QuizResult).filter(
        QuizResult.material_id == material_id
    ).all()
    for qr in quiz_results:
        db.query(QuizErrorDetail).filter(
            QuizErrorDetail.quiz_result_id == qr.id
        ).delete()
    
    # Paso 2 — borrar resultados de quiz
    db.query(QuizResult).filter(
        QuizResult.material_id == material_id
    ).delete()

    # Paso 3 — borrar registros de progreso
    db.query(LearningLog).filter(
        LearningLog.material_id == material_id
    ).delete()

    # Paso 4 — borrar etiquetas
    db.query(ContentTag).filter(
        ContentTag.material_id == material_id
    ).delete()

    # Paso 5 — borrar el material
    db.delete(material)
    db.commit()