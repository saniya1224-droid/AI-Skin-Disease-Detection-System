"""
Prediction routes — image upload, ML inference, report generation.
"""
import os
import uuid
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from app.database.db import db
from app.models.prediction import Prediction
from app.models.report import Report
from app.models.user import User
from app.services.ml_service import run_inference
from app.services.pdf_service import generate_pdf
from app.services.s3_service import upload_to_s3

predict_bp = Blueprint("predict", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "bmp"}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@predict_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    """POST /api/predict — Upload image and run ML inference."""
    user_id = get_jwt_identity()

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not _allowed_file(file.filename):
        return jsonify({"error": "File type not allowed. Use PNG, JPG, JPEG, WEBP, or BMP"}), 415

    # ── Save uploaded image ──────────────────────
    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    upload_dir = current_app.config["UPLOAD_FOLDER"]
    local_path = os.path.join(upload_dir, filename)
    file.save(local_path)

    # ── Try S3 upload (fallback to local) ────────
    image_path = local_path
    try:
        s3_key = f"uploads/{filename}"
        image_path = upload_to_s3(local_path, s3_key) or local_path
    except Exception:
        pass  # Use local path on S3 failure

    # ── ML Inference ─────────────────────────────
    try:
        result = run_inference(local_path)
    except Exception as e:
        return jsonify({"error": f"Inference failed: {str(e)}"}), 500

    # ── Persist prediction ───────────────────────
    prediction = Prediction(
        user_id=user_id,
        image_path=image_path,
        predicted_disease=result["disease"],
        confidence=result["confidence"],
        severity=result["severity"],
        heatmap_path=result.get("heatmap_path"),
        all_probabilities=result.get("all_probabilities"),
    )
    db.session.add(prediction)
    db.session.commit()

    return jsonify({
        "prediction": prediction.to_dict(),
        "symptoms": result.get("symptoms", []),
        "precautions": result.get("precautions", []),
        "specialist": result.get("specialist", "Dermatologist"),
    }), 201


@predict_bp.route("/report/generate/<string:prediction_id>", methods=["POST"])
@jwt_required()
def generate_report(prediction_id: str):
    """POST /api/report/generate/<id> — Generate PDF report for a prediction."""
    user_id = get_jwt_identity()
    prediction = Prediction.query.filter_by(id=prediction_id, user_id=user_id).first()

    if not prediction:
        return jsonify({"error": "Prediction not found"}), 404

    # Return existing report if already generated
    if prediction.report:
        return jsonify({"report": prediction.report.to_dict()}), 200

    user = User.query.get(user_id)
    try:
        pdf_path = generate_pdf(prediction, user)
    except Exception as e:
        return jsonify({"error": f"PDF generation failed: {str(e)}"}), 500

    report = Report(prediction_id=prediction.id, pdf_path=pdf_path)
    db.session.add(report)
    db.session.commit()

    return jsonify({"report": report.to_dict()}), 201


@predict_bp.route("/report/<string:report_id>", methods=["GET"])
@jwt_required()
def get_report(report_id: str):
    """GET /api/report/<id> — Download generated PDF report."""
    user_id = get_jwt_identity()
    report = Report.query.get(report_id)

    if not report:
        return jsonify({"error": "Report not found"}), 404
    if str(report.prediction.user_id) != user_id:
        return jsonify({"error": "Access denied"}), 403

    if not os.path.exists(report.pdf_path):
        return jsonify({"error": "PDF file not found on server"}), 404

    return send_file(
        report.pdf_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"dermai_report_{report_id[:8]}.pdf",
    )
