# backend/test_motor.py
from app.database import SessionLocal
from app.services.recommender import hybrid_recommendations
from app.models.user import User

db = SessionLocal()
usuario = db.query(User).filter_by(email="est1@test.com").first()

if usuario:
    print(f"Recomendaciones para: {usuario.nombre}")
    recs = hybrid_recommendations(str(usuario.id), db, top_n=3)
    for r in recs:
        print(f"  {r['titulo']} | score={r['score']} | {r['algoritmo']}")
else:
    print("Usuario no encontrado. Ejecuta seed_ml.py primero.")

db.close()