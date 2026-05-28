"""
EfficientNetB0 Transfer Learning Training Script.

Dataset: ISIC 2019 / HAM10000 (download separately)
Expected structure:
  data/
    train/
      Acne/  Eczema/  Psoriasis/  Ringworm/
      Melanoma/  Vitiligo/  Seborrheic_Dermatitis/  Basal_Cell_Carcinoma/
    val/
      (same structure)

Usage:
  python train.py --data_dir data/ --epochs 30 --batch_size 32
"""
import os
import argparse
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.callbacks import (
    ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard,
)
from sklearn.utils.class_weight import compute_class_weight

from augment import build_augmentation_layer

CLASSES = [
    "Acne", "Eczema", "Psoriasis", "Ringworm",
    "Melanoma", "Vitiligo", "Seborrheic Dermatitis", "Basal Cell Carcinoma",
]
NUM_CLASSES = len(CLASSES)
IMG_SIZE = (224, 224)
SAVE_DIR = os.path.join(os.path.dirname(__file__), "..", "saved_models")


def build_model(num_classes: int = NUM_CLASSES, trainable_base: bool = False) -> Model:
    """
    Build EfficientNetB0 transfer learning model.

    Architecture:
        EfficientNetB0 (pretrained ImageNet, frozen)
        → GlobalAveragePooling2D
        → Dense(256, relu)
        → Dropout(0.4)
        → Dense(num_classes, softmax)
    """
    base_model = EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(*IMG_SIZE, 3),
    )
    base_model.trainable = trainable_base

    inputs = tf.keras.Input(shape=(*IMG_SIZE, 3))
    x = build_augmentation_layer()(inputs, training=True)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = Model(inputs, outputs, name="DermAI_EfficientNetB0")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    return model


def load_datasets(data_dir: str, batch_size: int):
    """Load train and validation datasets from directory."""
    train_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(data_dir, "train"),
        image_size=IMG_SIZE,
        batch_size=batch_size,
        label_mode="categorical",
        class_names=CLASSES,
        shuffle=True,
        seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(data_dir, "val"),
        image_size=IMG_SIZE,
        batch_size=batch_size,
        label_mode="categorical",
        class_names=CLASSES,
        shuffle=False,
    )
    # Normalize
    normalize = layers.Rescaling(1.0 / 255)
    train_ds = train_ds.map(lambda x, y: (normalize(x), y)).prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.map(lambda x, y: (normalize(x), y)).prefetch(tf.data.AUTOTUNE)
    return train_ds, val_ds


def compute_weights(data_dir: str) -> dict:
    """Compute class weights to handle class imbalance."""
    labels = []
    for i, cls in enumerate(CLASSES):
        cls_dir = os.path.join(data_dir, "train", cls)
        if os.path.isdir(cls_dir):
            labels.extend([i] * len(os.listdir(cls_dir)))

    weights = compute_class_weight("balanced", classes=np.unique(labels), y=labels)
    return dict(enumerate(weights))


def train(args: argparse.Namespace) -> None:
    os.makedirs(SAVE_DIR, exist_ok=True)
    print(f"[DermAI] Loading datasets from {args.data_dir}")
    train_ds, val_ds = load_datasets(args.data_dir, args.batch_size)
    class_weights = compute_weights(args.data_dir)
    print(f"[DermAI] Class weights: {class_weights}")

    model = build_model()
    model.summary()

    callbacks = [
        ModelCheckpoint(
            os.path.join(SAVE_DIR, "efficientnet_dermai_best.h5"),
            monitor="val_auc", save_best_only=True, mode="max",
        ),
        EarlyStopping(monitor="val_auc", patience=8, mode="max", restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6),
        TensorBoard(log_dir=os.path.join(SAVE_DIR, "logs")),
    ]

    # Phase 1: Train top layers only
    print("[DermAI] Phase 1: Training top layers...")
    model.fit(
        train_ds, validation_data=val_ds,
        epochs=args.epochs, callbacks=callbacks,
        class_weight=class_weights,
    )

    # Phase 2: Fine-tune entire model
    print("[DermAI] Phase 2: Fine-tuning entire model...")
    model.trainable = True
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    model.fit(
        train_ds, validation_data=val_ds,
        epochs=args.epochs // 2, callbacks=callbacks,
        class_weight=class_weights,
    )

    final_path = os.path.join(SAVE_DIR, "efficientnet_dermai.h5")
    model.save(final_path)
    print(f"[DermAI] Model saved to {final_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train DermAI EfficientNetB0 model")
    parser.add_argument("--data_dir", type=str, default="data/", help="Path to dataset directory")
    parser.add_argument("--epochs", type=int, default=30, help="Training epochs (Phase 1)")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    args = parser.parse_args()
    train(args)
