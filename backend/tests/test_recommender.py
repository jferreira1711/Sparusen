"""test_recommender"""
import sys
import os
# Agregar la carpeta backend al path para poder importar app.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import MagicMock, patch
from app.services.recommender import (
    precision_at_k, recall_at_k, normalize_scores,
    _get_from_cache, _set_cache, invalidate_user_cache, _cache_key
)


class TestMetricas:
    def test_precision_perfecto(self):
        assert precision_at_k(["A", "B", "C"], ["A", "B", "C", "D"], k=3) == 1.0

    def test_precision_parcial(self):
        assert precision_at_k(["A", "B", "X", "Y"], ["A", "B", "C"], k=4) == 0.5

    def test_precision_cero(self):
        assert precision_at_k(["X", "Y"], ["A", "B"], k=2) == 0.0

    def test_precision_lista_vacia(self):
        assert precision_at_k([], ["A"], k=5) == 0.0

    def test_recall_perfecto(self):
        assert recall_at_k(["A", "B", "C"], ["A", "B"], k=3) == 1.0

    def test_recall_parcial(self):
        result = recall_at_k(["A", "X", "B"], ["A", "B", "C"], k=3)
        # Con k=3: top-3 = ["A","X","B"] → 2 hits sobre 3 relevantes = 0.6667
        assert 0.66 <= result <= 0.67

    def test_recall_sin_relevantes(self):
        assert recall_at_k(["A"], [], k=1) == 0.0


class TestNormalize:
    def test_normalize_rango_correcto(self):
        normalized = normalize_scores({"A": 5.0, "B": 3.0, "C": 1.0})
        for v in normalized.values():
            assert 0.0 <= v <= 1.0

    def test_normalize_maximo_es_uno(self):
        assert normalize_scores({"A": 10.0, "B": 5.0})["A"] == 1.0

    def test_normalize_vacio(self):
        assert normalize_scores({}) == {}


class TestCache:
    def test_cache_miss_devuelve_none(self):
        """Una clave que no existe devuelve None"""
        resultado = _get_from_cache("clave_que_no_existe_xyz")
        assert resultado is None

    def test_cache_set_y_get(self):
        """Guardar y recuperar del cache funciona"""
        datos = [{"titulo": "test", "score": 0.9}]
        _set_cache("test_key_123", datos)
        recuperado = _get_from_cache("test_key_123")
        assert recuperado == datos

    def test_cache_invalida_por_usuario(self):
        """Invalidar el cache de un usuario elimina sus entradas"""
        _set_cache("rec:usuario_test:5", [{"titulo": "a"}])
        _set_cache("rec:usuario_test:10", [{"titulo": "b"}])
        invalidate_user_cache("usuario_test")
        assert _get_from_cache("rec:usuario_test:5") is None
        assert _get_from_cache("rec:usuario_test:10") is None

    def test_cache_no_afecta_otros_usuarios(self):
        """Invalidar un usuario no borra el cache de otro"""
        _set_cache("rec:usuario_A:5", [{"titulo": "A"}])
        _set_cache("rec:usuario_B:5", [{"titulo": "B"}])
        invalidate_user_cache("usuario_A")
        assert _get_from_cache("rec:usuario_B:5") is not None


class TestPesosDinamicos:
    def test_usuario_nuevo_usa_solo_content_based(self):
        """Usuario con 0-2 materiales completados debe usar 100% content-based"""
        from app.services.recommender import get_dynamic_weights
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        weights = get_dynamic_weights("user123", mock_db)
        assert weights["weight_cb"] == 1.0
        assert weights["weight_col"] == 0.0
        assert weights["use_svd"] is False
        assert weights["nivel"] == "nuevo"

    def test_usuario_activo_pesos_80_20(self):
        """Usuario con 3-9 materiales: 80% content, 20% colaborativo, sin SVD"""
        from app.services.recommender import get_dynamic_weights
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.count.return_value = 5
        weights = get_dynamic_weights("user456", mock_db)
        assert weights["weight_cb"] == 0.8
        assert weights["weight_col"] == 0.2
        assert weights["use_svd"] is False
        assert weights["nivel"] == "activo"

    def test_usuario_regular_usa_svd(self):
        """Usuario con 10-19 materiales: SVD activado, pesos 65/35"""
        from app.services.recommender import get_dynamic_weights
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.count.return_value = 15
        weights = get_dynamic_weights("user789", mock_db)
        assert weights["weight_cb"] == 0.65
        assert weights["weight_col"] == 0.35
        assert weights["use_svd"] is True
        assert weights["nivel"] == "regular"

    def test_usuario_experto_pesos_iguales(self):
        """Usuario con 20+ materiales: 50% content, 50% colaborativo, SVD activo"""
        from app.services.recommender import get_dynamic_weights
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.count.return_value = 25
        weights = get_dynamic_weights("user_expert", mock_db)
        assert weights["weight_cb"] == 0.5
        assert weights["weight_col"] == 0.5
        assert weights["use_svd"] is True
        assert weights["nivel"] == "experto"