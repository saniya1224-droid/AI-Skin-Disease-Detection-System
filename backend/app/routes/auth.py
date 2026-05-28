"""
Auth routes — register, login, get current user.
"""
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.database.db import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """POST /api/auth/register — Create new user account."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    name: str = data.get("name", "").strip()
    email: str = data.get("email", "").strip().lower()
    password: str = data.get("password", "")
    role: str = data.get("role", "patient")

    # ── Validation ───────────────────────────────
    if not name or not email or not password:
        return jsonify({"error": "name, email, and password are required"}), 422
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 422
    if role not in ("patient", "admin"):
        role = "patient"

    # ── Duplicate check ──────────────────────────
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    # ── Hash & persist ───────────────────────────
    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(name=name, email=email, password_hash=pw_hash, role=role)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """POST /api/auth/login — Authenticate and return JWT."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    email: str = data.get("email", "").strip().lower()
    password: str = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 422

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """GET /api/auth/me — Return authenticated user's profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
