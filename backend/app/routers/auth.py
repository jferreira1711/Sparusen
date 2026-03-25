from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, StudentProfile, TeacherProfile, RolEnum
from app.schemas.user import UserRegister, UserLogin, UserOut, TokenOut
from app.core.security import hash_password, verify_password, create_access_token
import uuid

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):

    # 1. Verificar que el email no esté registrado ya
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # 2. Crear el usuario
    user = User(
        id=uuid.uuid4(),
        nombre=data.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=RolEnum(data.rol)
    )
    db.add(user)
    db.flush() # Genera el ID sin hacer commit aún

    # 3. Crear perfil según el rol
    if data.rol == "student":
        profile = StudentProfile(
        user_id=user.id,
        idioma_objetivo=data.idioma_objetivo or "inglés",
        idioma_nativo=data.idioma_nativo or "español",
        nivel_mcer_actual="A1"
        )
        db.add(profile)
    elif data.rol == "teacher":
        from app.models.user import TeacherProfile
        profile = TeacherProfile(user_id=user.id, especialidad="General")
        db.add(profile)
    
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenOut)
def login(data: UserLogin, db: Session = Depends(get_db)):
    
    # 1. Buscar el usuario por email
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # 2. Verificar la contraseña
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # 3. Verificar que el usuario está activo
    if not user.activo:
        raise HTTPException(status_code=403, detail="Usuario desactivado")
    
    # 4. Generar y devolver el token JWT
    token = create_access_token({"sub": str(user.id), "rol": user.rol.value})
    return {"access_token": token, "token_type": "bearer", "user": user}
