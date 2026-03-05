from sqlalchemy import Column, String, Boolean, Integer, DateTime, Float, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid, enum
class ResultadoPostEnum(enum.Enum):
    mejoro = "mejoró"; igual = "igual"; empeoro = "empeoró"

class TendenciaEnum(enum.Enum):
    mejorando = "mejorando"; estable = "estable"; empeorando = "empeorando"

class HabilidadEnum(enum.Enum):
    listening = "listening"; speaking = "speaking"; reading = "reading"
    writing = "writing"; grammar = "grammar"; vocabulary = "vocabulary"

class AiRecommendation(Base):
    __tablename__ = "ai_recommendations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    material_id_rec = Column(UUID(as_uuid=True), ForeignKey("materials.id"), nullable=False)
    motivo = Column(Text, nullable=False)
    aceptada = Column(Boolean, nullable=True, default=None)
    score_confianza = Column(Float, nullable=False)
    algoritmo_usado = Column(String(50), nullable=False)
    resultado_post = Column(Enum(ResultadoPostEnum), nullable=True)
    generada_en = Column(DateTime(timezone=True), server_default=func.now())
    respondida_en = Column(DateTime(timezone=True), nullable=True)

class UserSkillScore(Base):
    __tablename__ = "user_skill_scores"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    habilidad = Column(Enum(HabilidadEnum), nullable=False)
    score = Column(Float, default=0.0)
    tendencia = Column(Enum(TendenciaEnum), nullable=True)
    total_evaluaciones = Column(Integer, default=0)
    actualizado_en = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
