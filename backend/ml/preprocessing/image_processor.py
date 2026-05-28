"""
Image preprocessing pipeline for skin disease detection.

Steps:
1. Load image with PIL
2. Resize to 224×224
3. Convert to RGB
4. Apply CLAHE contrast enhancement (OpenCV)
5. Gaussian blur for noise reduction
6. Normalize pixel values to [0, 1]
"""
import cv2
import numpy as np
from PIL import Image
from typing import Optional


def preprocess_image(
    image_path: str,
    target_size: tuple[int, int] = (224, 224),
    apply_clahe: bool = True,
    apply_blur: bool = True,
) -> np.ndarray:
    """
    Full preprocessing pipeline for a skin image.

    Args:
        image_path: Path to the input image file.
        target_size: Target (width, height) for resizing.
        apply_clahe: Whether to apply CLAHE contrast enhancement.
        apply_blur: Whether to apply Gaussian blur for noise reduction.

    Returns:
        Normalized float32 numpy array of shape (1, 224, 224, 3).
    """
    # ── Step 1-3: Load, resize, convert to RGB ──────
    pil_img = Image.open(image_path).convert("RGB")
    pil_img = pil_img.resize(target_size, Image.LANCZOS)
    img_array = np.array(pil_img, dtype=np.uint8)

    # ── Step 4: CLAHE (Contrast Limited Adaptive Histogram Equalization) ──
    if apply_clahe:
        lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_channel = clahe.apply(l_channel)
        lab = cv2.merge([l_channel, a_channel, b_channel])
        img_array = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    # ── Step 5: Gaussian blur for noise reduction ────
    if apply_blur:
        img_array = cv2.GaussianBlur(img_array, (3, 3), 0)

    # ── Step 6: Normalize to [0, 1] ─────────────────
    img_normalized = img_array.astype(np.float32) / 255.0

    # Add batch dimension → (1, 224, 224, 3)
    return np.expand_dims(img_normalized, axis=0)


def preprocess_from_array(
    img_array: np.ndarray,
    target_size: tuple[int, int] = (224, 224),
) -> np.ndarray:
    """
    Preprocess a numpy array (e.g., from camera capture).

    Args:
        img_array: Input array of shape (H, W, 3).
        target_size: Target size.

    Returns:
        Normalized array of shape (1, 224, 224, 3).
    """
    pil_img = Image.fromarray(img_array.astype(np.uint8)).convert("RGB")
    pil_img = pil_img.resize(target_size, Image.LANCZOS)
    arr = np.array(pil_img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)
