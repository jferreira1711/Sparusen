from sqlalchemy import Column, String, Boolean, Integer, DateTime, Float, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid, enum
class TipoErrorEnum(enum.Enum):
    sintaxis = "sintaxis"; vocabulario = "vocabulario"; pronunciacion = "pronunciacion"
    comprension = "comprension"; tiempo_verbal = "tiempo_verbal"

class LearningLog(Base):
    __tablename__ = "learning_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False,index=True)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id"), nullable=False,index=True)
    tiempo_segundos = Column(Integer, default=0)
    completitud_pct = Column(Float, default=0.0)
    intentos = Column(Integer, default=1)
    ultima_posicion = Column(Integer, nullable=True)
    completado = Column(Boolean, default=False)
    registrado_en = Column(DateTime(timezone=True), server_default=func.now())

class QuizResult(Base):
    __tablename__ = "quiz_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False,index=True)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id"),nullable=False)
    puntuacion = Column(Float, nullable=False)
    preguntas_total = Column(Integer, nullable=False)
    respuestas_correctas = Column(Integer, nullable=False)
    tiempo_total_seg = Column(Integer, nullable=True)
    intento_numero = Column(Integer, default=1)
    realizado_en = Column(DateTime(timezone=True), server_default=func.now())
    error_details = relationship("QuizErrorDetail", back_populates="quiz_result")

class QuizErrorDetail(Base):
    __tablename__ = "quiz_error_details"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_result_id = Column(UUID(as_uuid=True), ForeignKey("quiz_results.id"), nullable=False)
    tipo_error = Column(Enum(TipoErrorEnum), nullable=False)
    frecuencia = Column(Integer, nullable=False)
    ejemplos_json = Column(JSONB, nullable=True)
    quiz_result = relationship("QuizResult", back_populates="error_details")