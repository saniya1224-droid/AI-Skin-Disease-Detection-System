"""
PDF Report Generator using ReportLab.
Produces a professional medical report with patient info,
uploaded image, Grad-CAM heatmap, predictions, and disclaimer.
"""
import os
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, HRFlowable, PageBreak,
)
from reportlab.pdfgen import canvas

if TYPE_CHECKING:
    from app.models.prediction import Prediction
    from app.models.user import User

# ── Color Palette ────────────────────────────
NAVY = colors.HexColor("#0f172a")
INDIGO = colors.HexColor("#6366f1")
TEAL = colors.HexColor("#14b8a6")
LIGHT_GRAY = colors.HexColor("#f1f5f9")
RED = colors.HexColor("#ef4444")
ORANGE = colors.HexColor("#f97316")
YELLOW = colors.HexColor("#eab308")
GREEN = colors.HexColor("#22c55e")

SEVERITY_COLORS = {
    "low": GREEN,
    "moderate": YELLOW,
    "high": ORANGE,
    "critical": RED,
}

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "reports")


def _page_template(canvas_obj: canvas.Canvas, doc) -> None:
    """Draw header and footer on every page."""
    canvas_obj.saveState()
    width, height = A4

    # Header bar
    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, height - 2 * cm, width, 2 * cm, fill=1, stroke=0)

    canvas_obj.setFillColor(INDIGO)
    canvas_obj.setFont("Helvetica-Bold", 16)
    canvas_obj.drawString(1.5 * cm, height - 1.4 * cm, "DermAI")

    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica", 10)
    canvas_obj.drawRightString(width - 1.5 * cm, height - 1.4 * cm, "AI-Powered Skin Analysis Report")

    # Footer
    canvas_obj.setFillColor(LIGHT_GRAY)
    canvas_obj.rect(0, 0, width, 1.2 * cm, fill=1, stroke=0)
    canvas_obj.setFillColor(NAVY)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawString(1.5 * cm, 0.4 * cm, "DermAI — Confidential Medical Report")
    canvas_obj.drawRightString(
        width - 1.5 * cm, 0.4 * cm, f"Page {doc.page}"
    )

    canvas_obj.restoreState()


def generate_pdf(prediction: "Prediction", user: "User") -> str:
    """Generate a PDF report and return its local file path."""
    os.makedirs(REPORTS_DIR, exist_ok=True)
    pdf_filename = f"report_{prediction.id}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, pdf_filename)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=3 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Title ─────────────────────────────────────
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        textColor=NAVY, fontSize=20, spaceAfter=6, alignment=TA_CENTER,
    )
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("Skin Disease Analysis Report", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=INDIGO, spaceAfter=12))

    # ── Patient Info Table ────────────────────────
    info_style = ParagraphStyle("Info", parent=styles["Normal"], fontSize=10)
    scan_date = (
        prediction.created_at.strftime("%B %d, %Y at %H:%M UTC")
        if prediction.created_at else datetime.now(timezone.utc).strftime("%B %d, %Y")
    )

    info_data = [
        ["Patient Name:", user.name, "Scan ID:", str(prediction.id)[:8].upper()],
        ["Email:", user.email, "Date:", scan_date],
        ["Report Generated:", datetime.now(timezone.utc).strftime("%B %d, %Y"), "", ""],
    ]

    info_table = Table(info_data, colWidths=[3.5 * cm, 7 * cm, 3 * cm, 4 * cm])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GRAY, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Images ────────────────────────────────────
    story.append(Paragraph("Scan Images", ParagraphStyle(
        "H2", parent=styles["Heading2"], textColor=NAVY, fontSize=13,
    )))

    image_cells = []
    if prediction.image_path and os.path.exists(prediction.image_path):
        try:
            img = RLImage(prediction.image_path, width=7 * cm, height=7 * cm, kind="proportional")
            image_cells.append([img, Paragraph("Original Upload", ParagraphStyle(
                "Caption", parent=styles["Normal"], fontSize=8, alignment=TA_CENTER,
            ))])
        except Exception:
            image_cells.append(["[Image not available]", ""])

    if prediction.heatmap_path and os.path.exists(prediction.heatmap_path):
        try:
            hm = RLImage(prediction.heatmap_path, width=7 * cm, height=7 * cm, kind="proportional")
            image_cells.append([hm, Paragraph("Grad-CAM Heatmap", ParagraphStyle(
                "Caption", parent=styles["Normal"], fontSize=8, alignment=TA_CENTER,
            ))])
        except Exception:
            image_cells.append(["[Heatmap not available]", ""])

    if image_cells:
        combined = [[cell[0] for cell in image_cells], [cell[1] for cell in image_cells]]
        img_table = Table(combined, colWidths=[8.5 * cm] * len(image_cells))
        img_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(img_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Prediction Results ────────────────────────
    severity_color = SEVERITY_COLORS.get(prediction.severity, NAVY)

    result_data = [
        ["Detected Condition", prediction.predicted_disease],
        ["Confidence Score", f"{prediction.confidence * 100:.1f}%"],
        ["Severity Level", prediction.severity.capitalize()],
    ]

    result_table = Table(result_data, colWidths=[6 * cm, 12 * cm])
    result_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("TEXTCOLOR", (1, 0), (1, 0), INDIGO),
        ("FONTNAME", (1, 0), (1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (1, 0), (1, 0), 14),
        ("TEXTCOLOR", (1, 2), (1, 2), severity_color),
        ("FONTNAME", (1, 2), (1, 2), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(Paragraph("Analysis Results", ParagraphStyle(
        "H2", parent=styles["Heading2"], textColor=NAVY, fontSize=13,
    )))
    story.append(result_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Disclaimer ────────────────────────────────
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#64748b"),
        borderColor=ORANGE,
        borderWidth=1,
        borderPadding=8,
        backColor=colors.HexColor("#fff7ed"),
    )
    story.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GRAY, spaceAfter=8))
    story.append(Paragraph(
        "⚠️  DISCLAIMER: This report is generated by an AI system and is intended for "
        "informational purposes only. It does NOT constitute a medical diagnosis. "
        "Please consult a certified dermatologist or qualified healthcare professional "
        "for proper evaluation and treatment.",
        disclaimer_style,
    ))

    doc.build(story, onFirstPage=_page_template, onLaterPages=_page_template)
    return pdf_path
