"""
DermAI Flask Application Factory
"""
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from app.database.db import db


def create_app(config_override: dict | None = None) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__, instance_relative_config=True)

    # ── Configuration ────────────────────────────
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "postgresql://dermai_user:dermai_pass@localhost:5432/dermai_db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET", "jwt-secret-change-me")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = int(
        os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 86400)
    )
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max upload
    app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "..", "uploads")

    if config_override:
        app.config.update(config_override)

    # Ensure upload dir exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # ── Extensions ───────────────────────────────
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)
    CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

    # ── Register Blueprints ──────────────────────
    from app.routes.auth import auth_bp
    from app.routes.predict import predict_bp
    from app.routes.history import history_bp
    from app.routes.admin import admin_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(chat_bp, url_prefix="/api")

    # ── Health Check ─────────────────────────────
    @app.route("/health")
    def health():
        return {"status": "ok", "service": "DermAI Backend"}, 200

    return app
