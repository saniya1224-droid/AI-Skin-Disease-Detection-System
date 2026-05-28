"""
Data augmentation layer for training — applied inline during model training.
"""
import tensorflow as tf
from tensorflow.keras import layers, Sequential


def build_augmentation_layer() -> Sequential:
    """
    Build Keras augmentation Sequential model.

    Augmentations applied:
    - Horizontal flip
    - Vertical flip
    - Random rotation (±15°)
    - Random brightness jitter (±20%)
    - Random zoom (±10%)
    - Random contrast adjustment
    """
    return Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(factor=15 / 360),       # ±15 degrees
        layers.RandomBrightness(factor=0.2),
        layers.RandomZoom(height_factor=0.1, width_factor=0.1),
        layers.RandomContrast(factor=0.1),
    ], name="data_augmentation")
