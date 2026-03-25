from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import decode_token

# Le dice a FastAPI dónde buscar el token en las peticiones
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)) -> User:
    """
    Extrae y valida el token JWT del header Authorization.
    Devuelve el usuario autenticado o lanza HTTP 401.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_error
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_error
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.activo:
        raise credentials_error
    
    return user

def get_current_student(current_user: User = Depends(get_current_user)) -> User:
    """Verifica que el usuario autenticado tenga rol de estudiante."""
    if current_user.rol.value != "student":
        raise HTTPException(status_code=403, detail="Solo estudiantes")
    return current_user

def get_current_teacher(current_user: User = Depends(get_current_user)) -> User:
    """Verifica que el usuario autenticado tenga rol de profesor."""
    if current_user.rol.value != "teacher":
        raise HTTPException(status_code=403, detail="Solo profesores")
    return current_user
