from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text, Float, Enum, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid, enum
class RolEnum(enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    rol = Column(Enum(RolEnum), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    # Relaciones
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False)
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False)
class StudentProfile(Base):
    __tablename__ = "student_profiles"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    nivel_mcer_actual = Column(String(2), nullable=False, default="A1")
    xp_total = Column(Integer, default=0)
    idioma_objetivo = Column(String(50), nullable=False)
    idioma_nativo = Column(String(50), nullable=False)
    intereses_json = Column(JSONB, nullable=True)
    racha_dias = Column(Integer, default=0)
    fecha_ultima_actividad = Column(DateTime(timezone=True), nullable=True)
    user = relationship("User", back_populates="student_profile")
class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    especialidad = Column(String(100), nullable=False)
    biografia = Column(Text, nullable=True)
    rating_promedio = Column(Float, default=0.0)
    total_clases = Column(Integer, default=0)
    disponibilidad_json = Column(JSONB, nullable=True)
    tarifa_hora = Column(Float, nullable=True)
    verificado = Column(Boolean, default=False)
    user = relationship("User", back_populates="teacher_profile")
class AdminProfile(Base):
    __tablename__ = "admin_profiles"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    nivel_autoridad = Column(Integer, nullable=False)
    departamento = Column(String(100), nullable=True)
    permisos_json = Column(JSONB, nullable=True)
    user = relationship("User", back_populates="admin_profile")