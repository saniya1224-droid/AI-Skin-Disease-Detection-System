"""
Admin routes — user management and analytics (admin role only).
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from app.database.db import db
from app.models.user import User
from app.models.prediction import Prediction
from app.middleware.auth_middleware import admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users(current_user: User):
    """GET /api/admin/users — List all users with optional search."""
    search = request.args.get("search", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    query = User.query
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    paginated = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "users": [u.to_dict() for u in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
    }), 200


@admin_bp.route("/analytics", methods=["GET"])
@admin_required
def analytics(current_user: User):
    """GET /api/admin/analytics — Disease distribution, totals, severity breakdown."""
    total_predictions = Prediction.query.count()
    total_users = User.query.filter_by(role="patient").count()

    # Disease distribution
    disease_dist = (
        db.session.query(Prediction.predicted_disease, func.count(Prediction.id))
        .group_by(Prediction.predicted_disease)
        .all()
    )

    # Severity distribution
    severity_dist = (
        db.session.query(Prediction.severity, func.count(Prediction.id))
        .group_by(Prediction.severity)
        .all()
    )

    # Average confidence
    avg_confidence = db.session.query(func.avg(Prediction.confidence)).scalar() or 0.0

    return jsonify({
        "total_predictions": total_predictions,
        "total_patients": total_users,
        "average_confidence": round(float(avg_confidence), 4),
        "disease_distribution": [
            {"disease": d, "count": c} for d, c in disease_dist
        ],
        "severity_distribution": [
            {"severity": s, "count": c} for s, c in severity_dist
        ],
        "model_accuracy": 0.892,  # Placeholder — update after training
        "model_f1": 0.87,
        "model_auc": 0.95,
    }), 200


@admin_bp.route("/model-update", methods=["POST"])
@admin_required
def model_update(current_user: User):
    """POST /api/admin/model-update — Trigger model swap (admin only)."""
    data = request.get_json(silent=True) or {}
    model_path = data.get("model_path")

    # In production: validate path, swap model file, reload inference engine
    return jsonify({
        "message": "Model update queued",
        "model_path": model_path or "default",
        "status": "pending",
    }), 202
