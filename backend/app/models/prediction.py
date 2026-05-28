"""
Prediction model — stores each ML inference result.
"""
import uuid
from datetime import datetime, timezone

from app.database.db import db


class Prediction(db.Model):
    __tablename__ = "predictions"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(
        db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True
    )
    image_path = db.Column(db.Text, nullable=False)
    predicted_disease = db.Column(db.String(100), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    severity = db.Column(
        db.Enum("low", "moderate", "high", "critical", name="severity_level"),
        nullable=False,
    )
    heatmap_path = db.Column(db.Text, nullable=True)
    all_probabilities = db.Column(db.JSON, nullable=True)  # {disease: prob, ...}
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # ── Relationships ────────────────────────────
    report = db.relationship("Report", backref="prediction", uselist=False, cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "image_path": self.image_path,
            "predicted_disease": self.predicted_disease,
            "confidence": self.confidence,
            "severity": self.severity,
            "heatmap_path": self.heatmap_path,
            "all_probabilities": self.all_probabilities,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "has_report": self.report is not None,
        }

    def __repr__(self) -> str:
        return f"<Prediction {self.predicted_disease} ({self.confidence:.2%})>"
