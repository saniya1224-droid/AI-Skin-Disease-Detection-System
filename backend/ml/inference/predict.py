"""
ML Model Inference — loads the EfficientNetB0 model and runs predictions.
"""
import os
import numpy as np
import tensorflow as tf
from typing import Optional

CLASSES = [
    "Acne", "Eczema", "Psoriasis", "Ringworm",
    "Melanoma", "Vitiligo", "Seborrheic Dermatitis", "Basal Cell Carcinoma",
]

_model_cache: Optional[tf.keras.Model] = None


def load_model(model_path: str) -> tf.keras.Model:
    """Load model from disk, with in-process caching."""
    global _model_cache
    if _model_cache is not None:
        return _model_cache

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found at {model_path}. "
            "Run backend/ml/training/train.py to train the model first."
        )

    _model_cache = tf.keras.models.load_model(model_path)
    print(f"[DermAI] Model loaded from {model_path}")
    return _model_cache


def predict_disease(
    model: tf.keras.Model,
    img_array: np.ndarray,
) -> tuple[str, float, dict[str, float]]:
    """
    Run inference and return top prediction.

    Args:
        model: Loaded Keras model.
        img_array: Preprocessed image array of shape (1, 224, 224, 3).

    Returns:
        Tuple of (disease_name, confidence, all_probabilities_dict)
    """
    predictions = model.predict(img_array, verbose=0)
    probs = predictions[0]

    top_idx = int(np.argmax(probs))
    disease = CLASSES[top_idx]
    confidence = float(probs[top_idx])

    all_probs = {cls: float(prob) for cls, prob in zip(CLASSES, probs)}

    return disease, confidence, all_probs
