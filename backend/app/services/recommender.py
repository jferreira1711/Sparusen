# app/services/recommender.py
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict
from scipy.sparse.linalg import svds
from scipy.sparse import csr_matrix
# ================= CACHE EN MEMORIA CON TTL =================
import time
from functools import wraps

# Cache en memoria: { cache_key: {"data": resultado, "timestamp": tiempo} }
_cache: Dict[str, dict] = {}
CACHE_TTL_SECONDS = 1800  # 30 minutos

def _cache_key(user_id: str, top_n: int) -> str:
    """Genera la clave única del cache para un usuario y cantidad."""
    return f"rec:{user_id}:{top_n}"

def _get_from_cache(key: str):
    """Devuelve datos del cache si existen y no han expirado. Sino None."""
    if key not in _cache:
        return None
    entry = _cache[key]
    if time.time() - entry["timestamp"] > CACHE_TTL_SECONDS:
        del _cache[key]  # Expirado — eliminar
        return None
    return entry["data"]

def _set_cache(key: str, data: list):
    """Guarda datos en el cache con la marca de tiempo actual."""
    _cache[key] = {"data": data, "timestamp": time.time()}

def invalidate_user_cache(user_id: str):
    """Borra todas las entradas del cache de un usuario."""
    keys_to_delete = [k for k in _cache if k.startswith(f"rec:{user_id}:")]
    for k in keys_to_delete:
        del _cache[k]

def _get_material_features(db: Session) -> pd.DataFrame:
    """
    Carga todos los materiales con sus etiquetas desde la BD.
    Devuelve DataFrame con columna 'features' = texto de todas las etiquetas.
    Ejemplo: material "Vocabulario A1" -> features = "video A1 A1 vocabulary vocabulary cotidiano cotidiano"
    """
    from app.models.content import Material
    materiales = db.query(Material).all()
    if not materiales:
        return pd.DataFrame(columns=["material_id", "titulo", "tipo", "features"])

    rows = []
    for m in materiales:
        # Repetir cada etiqueta 2 veces para darle más peso
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
    Recomienda materiales similares a los que el usuario ya estudió.
    Pasos:
      1) Cargar historial del usuario
      2) Vectorizar todos los materiales con TF-IDF
      3) Calcular similitud coseno entre materiales
      4) Acumular scores a partir de los materiales vistos
      5) Filtrar los ya vistos
      6) Devolver top_n mejores
    """
    from app.models.progress import LearningLog

    df = _get_material_features(db)
    if df.empty:
        return []

    # Materiales que el usuario ya ha visto
    logs = db.query(LearningLog).filter(LearningLog.user_id == user_id).all()
    vistos = {str(log.material_id) for log in logs}

    # Si no ha visto nada, recomendar los primeros (por orden de creación)
    if not vistos:
        result = df.head(top_n)
        return [
            {
                "material_id": r["material_id"],
                "titulo": r["titulo"],
                "tipo": r["tipo"],
                "score": 0.5,
                "motivo": "Recomendado para nuevos usuarios",
                "algoritmo": "content-based"
            }
            for _, r in result.iterrows()
        ]

    # Vectorización TF-IDF
    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform(df["features"])

    # Matriz de similitud coseno entre todos los materiales
    sim_matrix = cosine_similarity(tfidf_matrix)

    # Mapeo material_id -> índice en la matriz
    df_index = {row["material_id"]: i for i, row in df.iterrows()}

    # Acumular scores: para cada material visto, sumar su fila de similitud
    score_acum = np.zeros(len(df))
    for mat_id in vistos:
        if mat_id in df_index:
            score_acum += sim_matrix[df_index[mat_id]]

    # Agregar scores al DataFrame y filtrar los ya vistos
    df = df.copy()
    df["score_cb"] = score_acum
    df_result = df[~df["material_id"].isin(vistos)].sort_values("score_cb", ascending=False)

    return [
        {
            "material_id": row["material_id"],
            "titulo": row["titulo"],
            "tipo": row["tipo"],
            "score": round(float(row["score_cb"]), 4),
            "motivo": "Similar a materiales que ya estudiaste",
            "algoritmo": "content-based"
        }
        for _, row in df_result.head(top_n).iterrows()
    ]

# ================= PASO 4: ALGORITMO COLABORATIVO =================

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
    Pasos:
      1) Matriz usuario-material
      2) Similitud coseno entre usuarios
      3) Top 3 usuarios similares
      4) Recomendar sus materiales no vistos por el usuario actual
    """
    matrix = _build_user_item_matrix(db)
    if matrix.empty or user_id not in matrix.index:
        return []

    user_vector = matrix.loc[user_id].values.reshape(1, -1)
    other_users = matrix.drop(index=user_id)

    if other_users.empty:
        return []

    # Asegurar que las columnas coincidan (posibles materiales nuevos)
    other_aligned = other_users.reindex(columns=matrix.columns, fill_value=0)

    # Calcular similitud coseno entre el usuario objetivo y los demás
    similarities = cosine_similarity(user_vector, other_aligned.values)[0]

    # Top 3 usuarios más similares
    top_idx = similarities.argsort()[::-1][:3]
    top_users = other_aligned.index[top_idx].tolist()

    # Materiales que el usuario objetivo ya ha visto
    ya_vistos = set(matrix.columns[matrix.loc[user_id] > 0].tolist())

    # Acumular puntuaciones según los materiales completados por usuarios similares
    score_col: Dict[str, float] = {}
    for i, su in enumerate(top_users):
        peso = float(similarities[top_idx[i]])  # similitud como peso
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

# ================= PASO 5: MOTOR HÍBRIDO Y MÉTRICAS =================

def normalize_scores(scores: Dict[str, float]) -> Dict[str, float]:
    """Normaliza los scores al rango [0, 1]. Necesario para combinar algoritmos."""
    if not scores:
        return {}
    max_v = max(scores.values()) or 1
    return {k: v / max_v for k, v in scores.items()}

# ================= SVD RECOMMENDATIONS =================

def svd_recommendations(
    user_id: str, db: Session, top_n: int = 5, n_factors: int = 10
) -> List[Dict]:
    """
    Recomendaciones usando SVD (Singular Value Decomposition).
    Descompone la matriz usuario-material en n_factors factores latentes.
    Detecta patrones ocultos que el filtrado colaborativo simple no ve.

    Parámetros:
        n_factors: número de factores latentes (entre 2 y min(usuarios, materiales)-1)
    """
    matrix = _build_user_item_matrix(db)
    if matrix.empty or user_id not in matrix.index:
        return []

    n_users, n_items = matrix.shape
    # SVD necesita al menos 2 usuarios y 2 items
    if n_users < 2 or n_items < 2:
        return collaborative_recommendations(user_id, db, top_n=top_n)

    # Ajustar n_factors al máximo posible
    max_factors = min(n_users, n_items) - 1
    k = min(n_factors, max_factors)
    if k < 1:
        return collaborative_recommendations(user_id, db, top_n=top_n)

    # Convertir a matriz dispersa para eficiencia
    sparse_matrix = csr_matrix(matrix.values.astype(float))

    # Aplicar SVD: U * sigma * Vt = matrix
    # U = factores de usuario (n_usuarios x k)
    # sigma = valores singulares (k,)
    # Vt = factores de material (k x n_materiales)
    U, sigma, Vt = svds(sparse_matrix, k=k)

    # Reconstruir la matriz con los factores latentes
    sigma_diag = np.diag(sigma)
    predicted = np.dot(np.dot(U, sigma_diag), Vt)

    # Obtener el índice del usuario actual
    user_idx = list(matrix.index).index(user_id)

    # Scores predichos para el usuario actual
    user_scores = predicted[user_idx]

    # Materiales que ya vio (para excluirlos)
    ya_vistos_idx = [i for i, v in enumerate(matrix.loc[user_id].values) if v > 0]

    # Asignar score -inf a los ya vistos para que no aparezcan
    scores_filtrados = user_scores.copy()
    for idx in ya_vistos_idx:
        scores_filtrados[idx] = -np.inf

    # Top N indices por score predicho
    top_indices = np.argsort(scores_filtrados)[::-1][:top_n]
    mat_columns = list(matrix.columns)

    from app.models.content import Material
    result = []
    for idx in top_indices:
        if scores_filtrados[idx] == -np.inf:
            continue
        mat_id = mat_columns[idx]
        m = db.query(Material).filter(Material.id == mat_id).first()
        if m:
            result.append({
                "material_id": mat_id,
                "titulo": m.titulo,
                "tipo": m.tipo.value,
                "score": round(float(scores_filtrados[idx]), 4),
                "motivo": "Patrón de aprendizaje avanzado detectado",
                "algoritmo": "svd"
            })
    return result

# ================= PESOS DINÁMICOS SEGÚN HISTORIAL =================

def get_dynamic_weights(user_id: str, db: Session) -> dict:
    """
    Calcula los pesos del algoritmo híbrido según el historial del usuario.
    Devuelve:
        weight_cb: peso para content-based
        weight_col: peso para colaborativo/SVD
        use_svd: si se debe usar SVD (True) o colaborativo básico (False)
        nivel: etiqueta del nivel de usuario
        total: número de materiales completados
    """
    from app.models.progress import LearningLog
    total_completados = db.query(LearningLog).filter(
        LearningLog.user_id == user_id,
        LearningLog.completado == True
    ).count()

    if total_completados <= 2:
        return {
            "weight_cb": 1.0, "weight_col": 0.0, "use_svd": False,
            "nivel": "nuevo", "total": total_completados
        }
    elif total_completados <= 9:
        return {
            "weight_cb": 0.8, "weight_col": 0.2, "use_svd": False,
            "nivel": "activo", "total": total_completados
        }
    elif total_completados <= 19:
        return {
            "weight_cb": 0.65, "weight_col": 0.35, "use_svd": True,
            "nivel": "regular", "total": total_completados
        }
    else:
        return {
            "weight_cb": 0.5, "weight_col": 0.5, "use_svd": True,
            "nivel": "experto", "total": total_completados
        }
    
def hybrid_recommendations(
    user_id: str, db: Session, top_n: int = 5,
    weight_cb: float = None, weight_col: float = None
) -> List[Dict]:
    """
    Híbrido mejorado con SVD y pesos dinámicos.
    Si weight_cb y weight_col son None, se calculan automáticamente según el historial.
    """
    # === VERIFICAR CACHE ===
    cache_key = _cache_key(user_id, top_n)
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    # Obtener pesos dinámicos si no se especifican manualmente
    weights = get_dynamic_weights(user_id, db)
    w_cb = weight_cb if weight_cb is not None else weights["weight_cb"]
    w_col = weight_col if weight_col is not None else weights["weight_col"]
    use_svd = weights["use_svd"]

    # Content-based siempre (doble de candidatos para tener más mezcla)
    rec_cb = content_based_recommendations(user_id, db, top_n=top_n * 2)

    # Colaborativo: SVD si hay historial suficiente y peso > 0, si no, colaborativo básico
    if use_svd and w_col > 0:
        rec_col = svd_recommendations(user_id, db, top_n=top_n * 2)
        if not rec_col:
            rec_col = collaborative_recommendations(user_id, db, top_n=top_n * 2)
    elif w_col > 0:
        rec_col = collaborative_recommendations(user_id, db, top_n=top_n * 2)
    else:
        rec_col = []

    scores_cb = normalize_scores({r["material_id"]: r["score"] for r in rec_cb})
    scores_col = normalize_scores({r["material_id"]: r["score"] for r in rec_col})

    todos_ids = set(scores_cb.keys()) | set(scores_col.keys())
    if not todos_ids:
        return []

    hybrid = {
        mid: (scores_cb.get(mid, 0) * w_cb) + (scores_col.get(mid, 0) * w_col)
        for mid in todos_ids
    }

    from app.models.content import Material
    result = []
    algo_tag = "svd" if use_svd else "collaborative"

    for mat_id in sorted(hybrid, key=hybrid.get, reverse=True)[:top_n]:
        m = db.query(Material).filter(Material.id == mat_id).first()
        if not m:
            continue
        s_cb = scores_cb.get(mat_id, 0)
        s_col = scores_col.get(mat_id, 0)

        if s_cb >= s_col:
            motivo = "Similar a materiales que ya estudiaste"
            algoritmo = "hybrid-cb"
        else:
            motivo = "Patrón avanzado detectado" if use_svd else "Estudiantes similares"
            algoritmo = f"hybrid-{algo_tag}"

        result.append({
            "material_id": mat_id,
            "titulo": m.titulo,
            "tipo": m.tipo.value,
            "score": round(hybrid[mat_id], 4),
            "motivo": motivo,
            "algoritmo": algoritmo,
            "nivel_usuario": weights["nivel"]
        })

    # === GUARDAR EN CACHE antes del return ===
    _set_cache(cache_key, result)
    return result

# ================= MÉTRICAS PARA LA TESIS =================

def precision_at_k(recommended: List[str], relevant: List[str], k: int) -> float:
    """
    Proporción de recomendaciones relevantes en el top-K.
    recommended: lista de IDs recomendados (en orden)
    relevant: lista de IDs que realmente son relevantes (ground truth)
    k: número de elementos a considerar
    """
    if not recommended or k == 0:
        return 0.0
    hits = sum(1 for r in recommended[:k] if r in relevant)
    return round(hits / k, 4)

def recall_at_k(recommended: List[str], relevant: List[str], k: int) -> float:
    """
    Proporción de materiales relevantes que fueron recomendados en el top-K.
    """
    if not relevant or k == 0:
        return 0.0
    hits = sum(1 for r in recommended[:k] if r in relevant)
    return round(hits / len(relevant), 4)

