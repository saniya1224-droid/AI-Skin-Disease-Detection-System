"""
Grad-CAM (Gradient-weighted Class Activation Mapping) implementation.

Generates visual explanations for CNN predictions by highlighting
the regions of the input image most important for the prediction.
"""
import os
import cv2
import numpy as np
import tensorflow as tf
from typing import Optional


CLASSES = [
    "Acne", "Eczema", "Psoriasis", "Ringworm",
    "Melanoma", "Vitiligo", "Seborrheic Dermatitis", "Basal Cell Carcinoma",
]

HEATMAPS_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "uploads", "heatmaps"
)


def generate_gradcam(
    model: tf.keras.Model,
    img_array: np.ndarray,
    original_image_path: str,
    predicted_class: str,
    last_conv_layer_name: str = "top_conv",
) -> Optional[str]:
    """
    Generate a Grad-CAM heatmap overlay and save it to disk.

    Args:
        model: Trained Keras model.
        img_array: Preprocessed image array of shape (1, 224, 224, 3).
        original_image_path: Path to the original image for overlay.
        predicted_class: Name of the predicted disease class.
        last_conv_layer_name: Name of the last convolutional layer.

    Returns:
        Path to the saved heatmap PNG, or None on failure.
    """
    os.makedirs(HEATMAPS_DIR, exist_ok=True)

    class_idx = CLASSES.index(predicted_class) if predicted_class in CLASSES else 0

    try:
        # ── Build gradient model ─────────────────────
        grad_model = tf.keras.models.Model(
            inputs=model.inputs,
            outputs=[
                model.get_layer(last_conv_layer_name).output,
                model.output,
            ],
        )

        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(img_array)
            loss = predictions[:, class_idx]

        # ── Compute gradients ────────────────────────
        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # ── Weight activation maps ───────────────────
        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)
        heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
        heatmap = heatmap.numpy()

        # ── Overlay on original image ────────────────
        original_img = cv2.imread(original_image_path)
        if original_img is None:
            return None

        heatmap_resized = cv2.resize(heatmap, (original_img.shape[1], original_img.shape[0]))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(original_img, 0.6, heatmap_colored, 0.4, 0)

        # ── Save heatmap ─────────────────────────────
        base_name = os.path.splitext(os.path.basename(original_image_path))[0]
        heatmap_filename = f"heatmap_{base_name}.png"
        heatmap_path = os.path.join(HEATMAPS_DIR, heatmap_filename)
        cv2.imwrite(heatmap_path, overlay)

        return heatmap_path

    except Exception as e:
        print(f"[Grad-CAM] Failed to generate heatmap: {e}")
        return None
