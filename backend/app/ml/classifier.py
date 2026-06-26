"""Inference wrapper around the trained intent classifier.

Loads model.joblib lazily. If the model file is missing (not yet trained),
predict() returns (None, 0.0) so callers can fall back to keyword matching.
"""
from pathlib import Path
from typing import Optional, Tuple

MODEL_PATH = Path(__file__).parent / "model.joblib"

_model = None
_loaded = False


def _load():
    global _model, _loaded
    if _loaded:
        return
    _loaded = True
    try:
        import joblib
        if MODEL_PATH.exists():
            _model = joblib.load(MODEL_PATH)
    except Exception:
        _model = None


def predict(text: str) -> Tuple[Optional[str], float]:
    """Return (label, confidence). (None, 0.0) if no model is available."""
    _load()
    if _model is None or not text.strip():
        return None, 0.0
    try:
        proba = _model.predict_proba([text])[0]
        classes = _model.classes_
        idx = int(proba.argmax())
        return str(classes[idx]), float(proba[idx])
    except Exception:
        return None, 0.0


def is_available() -> bool:
    _load()
    return _model is not None
