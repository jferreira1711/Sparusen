from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text, Float, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid, enum
class TipoMaterialEnum(enum.Enum):
    video = "video"; pdf = "pdf"; quiz = "quiz"; audio = "audio"; ejercicio = "ejercicio"
class TagTypeEnum(enum.Enum):
    habilidad = "habilidad"; categoria = "categoria"
    nivel = "nivel"; tema = "tema"; contexto = "contexto"
class LearningLevel(Base):
    __tablename__ = "learning_levels"
    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(2), unique=True, nullable=False)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(Text, nullable=True)
    orden = Column(Integer, nullable=False)
    units = relationship("Unit", back_populates="level")
class Unit(Base):
    __tablename__ = "units"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    level_id = Column(Integer, ForeignKey("learning_levels.id"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    orden = Column(Integer, nullable=False)
    publicada = Column(Boolean, default=False)
    level = relationship("LearningLevel", back_populates="units")
    materials = relationship("Material", back_populates="unit")
class Material(Base):
    __tablename__ = "materials"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    tipo = Column(Enum(TipoMaterialEnum), nullable=False)
    url_recurso = Column(Text, nullable=False)
    duracion_segundos = Column(Integer, nullable=True)
    dificultad = Column(Integer, default=1)
    vistas_totales = Column(Integer, default=0)
    rating_promedio = Column(Float, default=0.0)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    unit = relationship("Unit", back_populates="materials")
    tags = relationship("ContentTag", back_populates="material")
class ContentTag(Base):
    __tablename__ = "content_tags"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id"), nullable=False)
    tag_type = Column(Enum(TagTypeEnum), nullable=False)
    tag_value = Column(String(100), nullable=False)
    material = relationship("Material", back_populates="tags")