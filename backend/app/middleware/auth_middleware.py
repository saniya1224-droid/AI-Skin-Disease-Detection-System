"""
JWT authentication middleware and decorators.
"""
from functools import wraps
from typing import Callable, Any

from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.models.user import User


def jwt_required_custom(fn: Callable) -> Callable:
    """Require valid JWT token. Injects current_user into view function."""
    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({"error": "Authentication required", "detail": str(e)}), 401

        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 401

        return fn(*args, current_user=user, **kwargs)
    return wrapper


def admin_required(fn: Callable) -> Callable:
    """Require valid JWT + admin role."""
    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({"error": "Authentication required", "detail": str(e)}), 401

        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 401
        if user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403

        return fn(*args, current_user=user, **kwargs)
    return wrapper
