"""
Model evaluation metrics — accuracy, F1, AUC, confusion matrix.
"""
import numpy as np
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    f1_score,
)
from typing import Optional

CLASSES = [
    "Acne", "Eczema", "Psoriasis", "Ringworm",
    "Melanoma", "Vitiligo", "Seborrheic Dermatitis", "Basal Cell Carcinoma",
]


def evaluate_model(
    y_true: np.ndarray,
    y_pred_probs: np.ndarray,
    class_names: Optional[list[str]] = None,
) -> dict:
    """
    Compute comprehensive evaluation metrics.

    Args:
        y_true: Ground truth integer labels, shape (N,).
        y_pred_probs: Model output probabilities, shape (N, num_classes).
        class_names: Class name labels.

    Returns:
        Dict with accuracy, macro F1, AUC, confusion matrix, per-class report.
    """
    if class_names is None:
        class_names = CLASSES

    y_pred = np.argmax(y_pred_probs, axis=1)

    accuracy = float(np.mean(y_pred == y_true))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))

    try:
        y_true_one_hot = np.eye(len(class_names))[y_true]
        auc = float(roc_auc_score(y_true_one_hot, y_pred_probs, multi_class="ovr", average="macro"))
    except ValueError:
        auc = 0.0

    cm = confusion_matrix(y_true, y_pred).tolist()
    report = classification_report(
        y_true, y_pred, target_names=class_names, output_dict=True, zero_division=0
    )

    return {
        "accuracy": round(accuracy, 4),
        "macro_f1": round(macro_f1, 4),
        "auc_roc": round(auc, 4),
        "confusion_matrix": cm,
        "per_class_report": report,
        "class_names": class_names,
    }


def print_metrics(metrics: dict) -> None:
    """Pretty-print evaluation results."""
    print(f"\n{'='*50}")
    print(f"  DermAI Model Evaluation Results")
    print(f"{'='*50}")
    print(f"  Accuracy:   {metrics['accuracy']:.2%}")
    print(f"  Macro F1:   {metrics['macro_f1']:.4f}")
    print(f"  AUC-ROC:    {metrics['auc_roc']:.4f}")
    print(f"{'='*50}\n")
