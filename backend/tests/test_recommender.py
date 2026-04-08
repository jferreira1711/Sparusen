import sys
import os
# Agregar la carpeta backend al path para poder importar app.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.recommender import precision_at_k, recall_at_k, normalize_scores

class TestMetricas:
    def test_precision_perfecto(self):
        """Si todos los recomendados son relevantes, precision = 1.0"""
        assert precision_at_k(["A","B","C"], ["A","B","C","D"], k=3) == 1.0

    def test_precision_parcial(self):
        """2 de 4 recomendados son relevantes -> precision@4 = 0.5"""
        assert precision_at_k(["A","B","X","Y"], ["A","B","C"], k=4) == 0.5

    def test_precision_cero(self):
        """Ninguno relevante -> precision = 0.0"""
        assert precision_at_k(["X","Y"], ["A","B"], k=2) == 0.0

    def test_precision_lista_vacia(self):
        assert precision_at_k([], ["A"], k=5) == 0.0

    def test_recall_perfecto(self):
        """Todos los relevantes recomendados -> recall = 1.0"""
        assert recall_at_k(["A","B","C"], ["A","B"], k=3) == 1.0

    def test_recall_parcial(self):
        """1 de 3 relevantes en top-2 -> recall = 0.333..."""
        result = recall_at_k(["A","X","B"], ["A","B","C"], k=2)
        assert 0.33 <= result <= 0.34

    def test_recall_sin_relevantes(self):
        assert recall_at_k(["A"], [], k=1) == 0.0

class TestNormalize:
    def test_normalize_rango_correcto(self):
        """Todos los scores normalizados deben estar entre 0 y 1"""
        scores = {"A": 5.0, "B": 3.0, "C": 1.0}
        normalized = normalize_scores(scores)
        for v in normalized.values():
            assert 0.0 <= v <= 1.0

    def test_normalize_maximo_es_uno(self):
        """El elemento con mayor score debe quedar en 1.0"""
        scores = {"A": 10.0, "B": 5.0}
        normalized = normalize_scores(scores)
        assert normalized["A"] == 1.0

    def test_normalize_vacio(self):
        assert normalize_scores({}) == {}