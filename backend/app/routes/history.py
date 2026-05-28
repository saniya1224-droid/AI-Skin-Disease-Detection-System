"""
History routes — retrieve past predictions for the authenticated user.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.prediction import Prediction

history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    """GET /api/history — Return paginated prediction history for current user."""
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    per_page = min(per_page, 50)  # Cap at 50

    paginated = (
        Prediction.query
        .filter_by(user_id=user_id)
        .order_by(Prediction.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        "predictions": [p.to_dict() for p in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": paginated.page,
        "has_next": paginated.has_next,
        "has_prev": paginated.has_prev,
    }), 200


@history_bp.route("/history/<string:prediction_id>", methods=["GET"])
@jwt_required()
def get_prediction_detail(prediction_id: str):
    """GET /api/history/<id> — Return single prediction detail."""
    user_id = get_jwt_identity()
    prediction = Prediction.query.filter_by(id=prediction_id, user_id=user_id).first()

    if not prediction:
        return jsonify({"error": "Prediction not found"}), 404

    return jsonify({"prediction": prediction.to_dict()}), 200
