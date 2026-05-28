"""
Report model — links a generated PDF to a prediction.
"""
import uuid
from datetime import datetime, timezone

from app.database.db import db


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("predictions.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    pdf_path = db.Column(db.Text, nullable=False)
    generated_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "prediction_id": str(self.prediction_id),
            "pdf_path": self.pdf_path,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
        }

    def __repr__(self) -> str:
        return f"<Report for prediction {self.prediction_id}>"
