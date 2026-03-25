from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, StudentProfile
from app.schemas.user import UserOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Usuarios"])

@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retorna el perfil completo del usuario autenticado."""
    return current_user

@router.put("/me", response_model=UserOut)
def update_my_profile(
    nombre: str = None,
    idioma_objetivo: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza nombre e idioma objetivo del usuario."""
    if nombre:
        current_user.nombre = nombre
    if idioma_objetivo and current_user.student_profile:
        current_user.student_profile.idioma_objetivo = idioma_objetivo
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=UserOut)
def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna el perfil público de cualquier usuario (para ver perfil de profesor)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user