"""
ML Inference Service — bridges Flask routes and the ML inference engine.
Supports real model inference and a mock mode for development.
"""
import os
import random
from typing import Any

# Disease metadata: symptoms, precautions, specialist, severity range
DISEASE_METADATA: dict[str, dict[str, Any]] = {
    "Acne": {
        "symptoms": [
            "Whiteheads or blackheads",
            "Pus-filled pimples",
            "Tender, inflamed bumps",
            "Scarring or dark spots",
        ],
        "precautions": [
            "Wash face twice daily with mild cleanser",
            "Avoid touching or popping pimples",
            "Use oil-free, non-comedogenic products",
            "Stay hydrated and maintain a balanced diet",
        ],
        "specialist": "Dermatologist",
        "severity_range": ["low", "moderate"],
    },
    "Eczema": {
        "symptoms": [
            "Dry, sensitive skin",
            "Intense itching",
            "Red to brownish-gray patches",
            "Swollen, cracked skin",
        ],
        "precautions": [
            "Moisturize regularly with fragrance-free cream",
            "Avoid harsh soaps and detergents",
            "Use mild, fragrance-free laundry detergent",
            "Identify and avoid personal triggers",
        ],
        "specialist": "Dermatologist / Allergist",
        "severity_range": ["moderate", "high"],
    },
    "Psoriasis": {
        "symptoms": [
            "Red patches covered with thick, silvery scales",
            "Dry, cracked skin that may bleed",
            "Itching, burning, or soreness",
            "Thickened, pitted, or ridged nails",
        ],
        "precautions": [
            "Keep skin moisturized",
            "Avoid injury to skin",
            "Reduce stress levels",
            "Avoid smoking and limit alcohol",
        ],
        "specialist": "Dermatologist / Rheumatologist",
        "severity_range": ["moderate", "critical"],
    },
    "Ringworm": {
        "symptoms": [
            "Ring-shaped rash",
            "Scaly, itchy skin patch",
            "Slightly raised borders",
            "Hair loss in affected area",
        ],
        "precautions": [
            "Keep skin clean and dry",
            "Avoid sharing personal items",
            "Wear breathable, loose clothing",
            "Complete the full antifungal treatment course",
        ],
        "specialist": "Dermatologist",
        "severity_range": ["low", "moderate"],
    },
    "Melanoma": {
        "symptoms": [
            "Asymmetric mole or growth",
            "Irregular, notched borders",
            "Multiple colors in one lesion",
            "Diameter larger than 6mm",
            "Evolving size, shape, or color",
        ],
        "precautions": [
            "Seek IMMEDIATE dermatologist consultation",
            "Avoid sun exposure and use SPF 50+",
            "Do not attempt self-treatment",
            "Document any changes with photos",
        ],
        "specialist": "Oncologist / Dermatologist",
        "severity_range": ["high", "critical"],
    },
    "Vitiligo": {
        "symptoms": [
            "Patchy loss of skin color",
            "Premature whitening of hair",
            "Loss of color in mucous membranes",
            "Symmetrical white patches",
        ],
        "precautions": [
            "Use broad-spectrum sunscreen",
            "Protect depigmented areas from sun",
            "Manage stress levels",
            "Consult for cosmetic or medical therapy options",
        ],
        "specialist": "Dermatologist",
        "severity_range": ["low", "moderate"],
    },
    "Seborrheic Dermatitis": {
        "symptoms": [
            "Flaking skin (dandruff) on scalp",
            "Patches of greasy skin with white scales",
            "Red skin, rash",
            "Itching",
        ],
        "precautions": [
            "Use medicated shampoo regularly",
            "Manage stress",
            "Avoid harsh hair products",
            "Keep affected areas clean and dry",
        ],
        "specialist": "Dermatologist",
        "severity_range": ["low", "moderate"],
    },
    "Basal Cell Carcinoma": {
        "symptoms": [
            "Pearly or waxy bump",
            "Flat, flesh-colored lesion",
            "Bleeding or scabbing sore",
            "Pink growth with raised edges",
        ],
        "precautions": [
            "Seek IMMEDIATE dermatologist consultation",
            "Avoid UV radiation; use SPF 50+",
            "Do not delay treatment",
            "Regular skin checks by a professional",
        ],
        "specialist": "Dermatologist / Surgical Oncologist",
        "severity_range": ["high", "critical"],
    },
}

DISEASES = list(DISEASE_METADATA.keys())
SEVERITY_LEVELS = ["low", "moderate", "high", "critical"]


def _severity_from_confidence(disease: str, confidence: float) -> str:
    """Map disease + confidence to a severity level."""
    meta = DISEASE_METADATA.get(disease, {})
    severity_range = meta.get("severity_range", ["low", "moderate"])
    low_idx = SEVERITY_LEVELS.index(severity_range[0])
    high_idx = SEVERITY_LEVELS.index(severity_range[-1])
    # High confidence → higher end of range
    idx = low_idx if confidence < 0.7 else high_idx
    return SEVERITY_LEVELS[idx]


def run_inference(image_path: str) -> dict[str, Any]:
    """
    Run skin disease inference on the given image path.

    Returns:
        dict with keys: disease, confidence, severity, heatmap_path,
                        all_probabilities, symptoms, precautions, specialist
    """
    mock_mode = os.environ.get("MOCK_INFERENCE", "true").lower() == "true"

    if not mock_mode:
        return _real_inference(image_path)
    else:
        return _mock_inference(image_path)


def _real_inference(image_path: str) -> dict[str, Any]:
    """Load and run the real EfficientNetB0 model."""
    import numpy as np
    from ml.preprocessing.image_processor import preprocess_image
    from ml.inference.predict import load_model, predict_disease
    from ml.inference.gradcam import generate_gradcam

    model = load_model(os.environ.get("MODEL_PATH", "ml/saved_models/efficientnet_dermai.h5"))
    img_array = preprocess_image(image_path)
    disease, confidence, all_probs = predict_disease(model, img_array)

    # Generate Grad-CAM heatmap
    heatmap_path = None
    try:
        heatmap_path = generate_gradcam(model, img_array, image_path, disease)
    except Exception:
        pass

    severity = _severity_from_confidence(disease, confidence)
    meta = DISEASE_METADATA.get(disease, {})

    return {
        "disease": disease,
        "confidence": round(confidence, 4),
        "severity": severity,
        "heatmap_path": heatmap_path,
        "all_probabilities": all_probs,
        "symptoms": meta.get("symptoms", []),
        "precautions": meta.get("precautions", []),
        "specialist": meta.get("specialist", "Dermatologist"),
    }


def _mock_inference(image_path: str) -> dict[str, Any]:
    """Return realistic mock inference results for development."""
    disease = random.choice(DISEASES)
    confidence = round(random.uniform(0.72, 0.97), 4)
    severity = _severity_from_confidence(disease, confidence)
    meta = DISEASE_METADATA[disease]

    # Generate mock probability distribution
    remaining = round(1.0 - confidence, 4)
    other_diseases = [d for d in DISEASES if d != disease]
    other_probs = [round(random.uniform(0, remaining), 4) for _ in range(len(other_diseases) - 1)]
    other_probs.append(round(remaining - sum(other_probs), 4))

    all_probs = {disease: confidence}
    for d, p in zip(other_diseases, other_probs):
        all_probs[d] = max(0.0, p)

    return {
        "disease": disease,
        "confidence": confidence,
        "severity": severity,
        "heatmap_path": None,
        "all_probabilities": all_probs,
        "symptoms": meta["symptoms"],
        "precautions": meta["precautions"],
        "specialist": meta["specialist"],
    }
