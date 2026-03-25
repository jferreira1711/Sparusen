from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base
import uuid, enum

class TipoPreguntaEnum(enum.Enum):
    multiple = "multiple" # 4 opciones, una correcta
    truefalse = "truefalse" # Verdadero / Falso
    fill = "fill" # Completar el espacio en blanco

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id = Column(UUID(as_uuid=True), ForeignKey("materials.id"), nullable=False, index=True)
    texto = Column(Text, nullable=False)
    tipo = Column(Enum(TipoPreguntaEnum), default=TipoPreguntaEnum.multiple)
    opciones_json = Column(JSONB, nullable=True) # ["Manzana","Naranja","Pera","Uva"]
    respuesta_correcta= Column(String(200), nullable=False) # "A", "true", "went"
    explicacion = Column(Text, nullable=True) # Por qué esa es la respuesta
    orden = Column(Integer, default=1)
    puntos = Column(Integer, default=10) # Puntos que vale esta pregunta
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
