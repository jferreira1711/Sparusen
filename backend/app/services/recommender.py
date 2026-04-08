# backend/app/services/recommender.py
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict

# ==================== CONTENT-BASED (PASO 3) ====================

def _get_material_features(db: Session) -> pd.DataFrame:
    """
    Carga todos los materiales con sus etiquetas desde la BD.
    Devuelve DataFrame con columna features = texto de todas las etiquetas.
    Ejemplo: material "Vocabulario A1" -> features = "video A1 A1 vocabulary vocabulary cotidiano cotidiano"
    """
    from app.models.content import Material
    materiales = db.query(Material).all()
    if not materiales:
        return pd.DataFrame(columns=["material_id","titulo","tipo","features"])

    rows = []
    for m in materiales:
        # Repetir cada etiqueta 2 veces para darle mas peso
        tags_text = " ".join([f"{t.tag_value} {t.tag_value}" for t in m.tags])
        features = f"{m.tipo.value} {tags_text}".strip() or "general"
        rows.append({
            "material_id": str(m.id),
            "titulo": m.titulo,
            "tipo": m.tipo.value,
            "dificultad": m.dificultad,
            "features": features
        })
    return pd.DataFrame(rows)

def content_based_recommendations(
    user_id: str, db: Session, top_n: int = 5
) -> List[Dict]:
    """
    Recomienda materiales similares a los que el usuario ya estudio.
    Pasos: 1) cargar historial 2) vectorizar con TF-IDF 3) cosine similarity
    4) acumular scores 5) filtrar vistos 6) devolver top_n
    """
    from app.models.progress import LearningLog

    df = _get_material_features(db)
    if df.empty:
        return []

    logs = db.query(LearningLog).filter(LearningLog.user_id == user_id).all()
    vistos = {str(log.material_id) for log in logs}

    if not vistos:
        result = df.head(top_n)
        return [{"material_id":r["material_id"],"titulo":r["titulo"],
                 "tipo":r["tipo"],"score":0.5,
                 "motivo":"Recomendado para nuevos usuarios","algoritmo":"content-based"}
                for _,r in result.iterrows()]

    # Vectorizar con TF-IDF
    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform(df["features"])

    # Matriz de similitud material x material
    sim_matrix = cosine_similarity(tfidf_matrix)

    # Indice para buscar rapido por material_id
    df_index = {row["material_id"]: i for i, row in df.iterrows()}

    score_acum = np.zeros(len(df))
    for mat_id in vistos:
        if mat_id in df_index:
            score_acum += sim_matrix[df_index[mat_id]]

    df = df.copy()
    df["score_cb"] = score_acum
    df_result = df[~df["material_id"].isin(vistos)].sort_values("score_cb", ascending=False)

    return [{"material_id":row["material_id"],"titulo":row["titulo"],
             "tipo":row["tipo"],"score":round(float(row["score_cb"]),4),
             "motivo":"Similar a materiales que ya estudiaste","algoritmo":"content-based"}
            for _,row in df_result.head(top_n).iterrows()]


# ==================== COLABORATIVO (PASO 4) ====================

def _build_user_item_matrix(db: Session) -> pd.DataFrame:
    """
    Construye la matriz usuario-material.
    Filas = usuarios, Columnas = materiales, Valor = 1 si completo, 0 si no.
    """
    from app.models.progress import LearningLog
    logs = db.query(LearningLog).filter(LearningLog.completado == True).all()
    if not logs:
        return pd.DataFrame()
    data = [{"user_id": str(l.user_id), "material_id": str(l.material_id), "valor": 1}
            for l in logs]
    df = pd.DataFrame(data)
    return df.pivot_table(index="user_id", columns="material_id",
                          values="valor", fill_value=0)

def collaborative_recommendations(
    user_id: str, db: Session, top_n: int = 5
) -> List[Dict]:
    """
    Recomienda materiales que usuarios similares completaron.
    Pasos: 1) matriz usuario-material 2) similitud coseno entre usuarios
    3) top 3 usuarios similares 4) recomendar sus materiales no vistos
    """
    matrix = _build_user_item_matrix(db)
    if matrix.empty or user_id not in matrix.index:
        return []

    user_vector = matrix.loc[user_id].values.reshape(1, -1)
    other_users = matrix.drop(index=user_id)
    if other_users.empty:
        return []

    other_aligned = other_users.reindex(columns=matrix.columns, fill_value=0)
    similarities = cosine_similarity(user_vector, other_aligned.values)[0]

    # Top 3 usuarios mas similares
    top_idx = similarities.argsort()[::-1][:3]
    top_users = other_aligned.index[top_idx].tolist()

    ya_vistos = set(matrix.columns[matrix.loc[user_id] > 0].tolist())

    score_col: Dict[str, float] = {}
    for i, su in enumerate(top_users):
        peso = float(similarities[top_idx[i]])
        completados = set(other_aligned.columns[other_aligned.loc[su] > 0].tolist())
        for mat_id in completados - ya_vistos:
            score_col[mat_id] = score_col.get(mat_id, 0) + peso

    if not score_col:
        return []

    from app.models.content import Material
    top_ids = sorted(score_col, key=score_col.get, reverse=True)[:top_n]

    result = []
    for mat_id in top_ids:
        m = db.query(Material).filter(Material.id == mat_id).first()
        if m:
            result.append({
                "material_id": mat_id,
                "titulo": m.titulo,
                "tipo": m.tipo.value,
                "score": round(score_col[mat_id], 4),
                "motivo": "Estudiantes similares lo completaron",
                "algoritmo": "collaborative"
            })
    return result

# ==================== HÍBRIDO Y MÉTRICAS (PASO 5) ====================

def normalize_scores(scores: Dict[str, float]) -> Dict[str, float]:
    """Normaliza scores al rango [0, 1]. Necesario para combinar algoritmos."""
    if not scores:
        return {}
    max_v = max(scores.values()) or 1
    return {k: v / max_v for k, v in scores.items()}

def hybrid_recommendations(
    user_id: str, db: Session, top_n: int = 5,
    weight_cb: float = 0.7, weight_col: float = 0.3
) -> List[Dict]:
    """
    Combina content-based (70%) y collaborative (30%).
    Formula: score_hibrido = (score_cb * 0.7) + (score_col * 0.3)
    """
    rec_cb = content_based_recommendations(user_id, db, top_n=top_n * 2)
    rec_col = collaborative_recommendations(user_id, db, top_n=top_n * 2)

    scores_cb = normalize_scores({r["material_id"]: r["score"] for r in rec_cb})
    scores_col = normalize_scores({r["material_id"]: r["score"] for r in rec_col})

    todos_ids = set(scores_cb.keys()) | set(scores_col.keys())
    hybrid: Dict[str, float] = {
        mid: (scores_cb.get(mid, 0) * weight_cb) + (scores_col.get(mid, 0) * weight_col)
        for mid in todos_ids
    }

    from app.models.content import Material
    result = []
    for mat_id in sorted(hybrid, key=hybrid.get, reverse=True)[:top_n]:
        m = db.query(Material).filter(Material.id == mat_id).first()
        if not m:
            continue
        s_cb = scores_cb.get(mat_id, 0)
        s_col = scores_col.get(mat_id, 0)
        algoritmo = "hybrid-cb" if s_cb >= s_col else "hybrid-col"
        motivo = "Similar a tu historial" if s_cb >= s_col else "Estudiantes similares lo recomiendan"
        result.append({
            "material_id": mat_id,
            "titulo": m.titulo,
            "tipo": m.tipo.value,
            "score": round(hybrid[mat_id], 4),
            "motivo": motivo,
            "algoritmo": algoritmo
        })
    return result

# Métricas para la tesis
def precision_at_k(recommended: List[str], relevant: List[str], k: int) -> float:
    """Proporción de recomendaciones relevantes en el top-K."""
    if not recommended or k == 0:
        return 0.0
    hits = sum(1 for r in recommended[:k] if r in relevant)
    return round(hits / k, 4)

def recall_at_k(recommended: List[str], relevant: List[str], k: int) -> float:
    """Proporción de materiales relevantes que fueron recomendados."""
    if not relevant or k == 0:
        return 0.0
    hits = sum(1 for r in recommended[:k] if r in relevant)
    return round(hits / len(relevant), 4)