import sys
import os

# Esto le dice a Python que busque módulos en backend/
# porque seed.py ahora está un nivel más adentro
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.content import LearningLevel

def seed_levels():
    db = SessionLocal()

    existe = db.query(LearningLevel).first()
    if existe:
        print("⚠️ Los niveles ya existen, no se insertaron de nuevo")
        db.close()
        return

    niveles = [
        LearningLevel(codigo="A1", nombre="Principiante", descripcion="Usuario básico — nivel inicial", orden=1),
        LearningLevel(codigo="A2", nombre="Pre-intermedio", descripcion="Usuario básico — supervivencia", orden=2),
        LearningLevel(codigo="B1", nombre="Intermedio", descripcion="Usuario independiente — umbral", orden=3),
        LearningLevel(codigo="B2", nombre="Interm. avanzado", descripcion="Usuario independiente — avanzado", orden=4),
        LearningLevel(codigo="C1", nombre="Avanzado", descripcion="Usuario competente — eficaz", orden=5),
        LearningLevel(codigo="C2", nombre="Maestría", descripcion="Usuario competente — maestría", orden=6),
    ]
    db.add_all(niveles)
    db.commit()
    db.close()
    print("✅ 6 niveles MCER insertados correctamente")

if __name__ == "__main__":
    seed_levels()