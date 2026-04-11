# backend/seed_ml.py
from app.database import SessionLocal
from app.models.user import User, StudentProfile, RolEnum
from app.models.content import LearningLevel, Unit, Material, ContentTag
from app.models.content import TipoMaterialEnum, TagTypeEnum
from app.models.progress import LearningLog
from app.core.security import hash_password
import uuid

def seed_ml_data():
    db = SessionLocal()
    nivel_a1 = db.query(LearningLevel).filter_by(codigo="A1").first()
    nivel_b1 = db.query(LearningLevel).filter_by(codigo="B1").first()
    if not nivel_a1:
        print("Ejecuta seed.py primero para crear los niveles MCER")
        return

    # Crear unidades de ejemplo
    unit1 = Unit(id=uuid.uuid4(), level_id=nivel_a1.id,
                 titulo="Ingles A1 Fundamentos", orden=1, publicada=True)
    unit2 = Unit(id=uuid.uuid4(), level_id=nivel_b1.id,
                 titulo="Ingles B1 Gramatica avanzada", orden=1, publicada=True)
    db.add_all([unit1, unit2])
    db.flush()

    # Crear 8 materiales con etiquetas variadas
    materiales = [
        ("Vocabulario basico A1", "video", unit1.id,
         [("nivel","A1"),("habilidad","vocabulary"),("tema","cotidiano")]),
        ("Gramatica presente A1", "pdf", unit1.id,
         [("nivel","A1"),("habilidad","grammar"),("tema","presente")]),
        ("Listening basico A1", "audio", unit1.id,
         [("nivel","A1"),("habilidad","listening"),("tema","saludos")]),
        ("Quiz A1 Numeros", "quiz", unit1.id,
         [("nivel","A1"),("habilidad","vocabulary"),("tema","numeros")]),
        ("Reading comprension B1", "pdf", unit2.id,
         [("nivel","B1"),("habilidad","reading"),("tema","negocios")]),
        ("Grammar Past Perfect B1","video", unit2.id,
         [("nivel","B1"),("habilidad","grammar"),("tema","pasado")]),
        ("Listening avanzado B1", "audio", unit2.id,
         [("nivel","B1"),("habilidad","listening"),("tema","noticias")]),
        ("Speaking ejercicios B1", "ejercicio", unit2.id,
         [("nivel","B1"),("habilidad","speaking"),("tema","debate")]),
    ]

    mat_ids = []
    for titulo, tipo, unit_id, tags in materiales:
        m = Material(id=uuid.uuid4(), unit_id=unit_id, titulo=titulo,
                     tipo=TipoMaterialEnum(tipo),
                     url_recurso="https://example.com/" + titulo[:10].replace(" ","-"),
                     dificultad=1)
        db.add(m)
        db.flush()
        mat_ids.append(m.id)
        for tag_type, tag_value in tags:
            db.add(ContentTag(id=uuid.uuid4(), material_id=m.id,
                              tag_type=TagTypeEnum(tag_type), tag_value=tag_value))

    # Crear 3 estudiantes de prueba con historiales distintos
    estudiantes = [
        ("est1@test.com", "Estudiante Uno", [0, 1, 2]),
        ("est2@test.com", "Estudiante Dos", [0, 1, 4, 5]),
        ("est3@test.com", "Estudiante Tres", [2, 3, 6, 7]),
    ]

    for email, nombre, indices in estudiantes:
        if db.query(User).filter_by(email=email).first():
            continue
        u = User(id=uuid.uuid4(), nombre=nombre, email=email,
                 password_hash=hash_password("test123"), rol=RolEnum.student)
        db.add(u)
        db.flush()
        db.add(StudentProfile(user_id=u.id, idioma_objetivo="ingles",
                              idioma_nativo="espanol", nivel_mcer_actual="A1"))
        for idx in indices:
            db.add(LearningLog(id=uuid.uuid4(), user_id=u.id,
                               material_id=mat_ids[idx], tiempo_segundos=300,
                               completitud_pct=100.0, completado=True))

    db.commit()
    db.close()
    print("Datos ML insertados: 8 materiales + 3 estudiantes de prueba")

if __name__ == "__main__":
    seed_ml_data()