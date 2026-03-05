from sqlalchemy import Column, String, Boolean, Integer, DateTime, Float, Enum, ForeignKey, Text, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid, enum
class EstadoSesionEnum(enum.Enum):
    programada = "programada"; en_curso = "en_curso"
    finalizada = "finalizada"; cancelada = "cancelada"
class LiveSession(Base):
    __tablename__ = "live_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    fecha_hora_inicio = Column(DateTime(timezone=True), nullable=False)
    fecha_hora_fin = Column(DateTime(timezone=True), nullable=True)
    duracion_minutos = Column(Integer, nullable=True)
    estado = Column(Enum(EstadoSesionEnum), default=EstadoSesionEnum.programada)
    url_sala = Column(Text, nullable=True)
    url_grabacion = Column(Text, nullable=True)
    tema_clase = Column(String(200), nullable=True)
    notas_profesor = Column(Text, nullable=True)
    valoracion_alumno = Column(Integer, nullable=True)
    whiteboards = relationship("WhiteboardSession", back_populates="session")

class WhiteboardSession(Base):
    __tablename__ = "whiteboard_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("live_sessions.id"), nullable=False)
    snapshot_json = Column(JSONB, nullable=False)
    version = Column(Integer, default=1)
    guardado_por = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    guardado_en = Column(DateTime(timezone=True), server_default=func.now())
    session = relationship("LiveSession", back_populates="whiteboards")
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    accion = Column(String(50), nullable=False)
    tabla_afectada = Column(String(100), nullable=False)
    registro_id = Column(Text, nullable=True)
    valor_anterior = Column(JSONB, nullable=True)
    valor_nuevo = Column(JSONB, nullable=True)
    ip_origen = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())