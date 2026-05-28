"""
Chat route — dermatology AI assistant powered by OpenAI.
"""
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

chat_bp = Blueprint("chat", __name__)

SYSTEM_PROMPT = (
    "You are a compassionate dermatology assistant named DermAI. "
    "You provide general information about skin conditions, precautions, prevention tips, "
    "and guidance on when to see a doctor. "
    "IMPORTANT: You do NOT diagnose conditions. Always recommend consulting a certified dermatologist "
    "for any medical concerns. Be empathetic, clear, and concise."
)


@chat_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    """POST /api/chat — Send message to dermatology AI assistant."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    messages: list[dict] = data.get("messages", [])
    user_message: str = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "message is required"}), 422

    api_key = os.environ.get("OPENAI_API_KEY", "")

    # ── OpenAI Integration ───────────────────────
    if api_key and api_key != "your-openai-api-key":
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)

            conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
            conversation.extend(messages[-10:])  # Keep last 10 for context
            conversation.append({"role": "user", "content": user_message})

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=conversation,
                max_tokens=500,
                temperature=0.7,
            )
            reply = response.choices[0].message.content
        except Exception as e:
            return jsonify({"error": f"AI service error: {str(e)}"}), 502
    else:
        # ── Fallback mock response ────────────────
        reply = _mock_response(user_message)

    return jsonify({"reply": reply, "role": "assistant"}), 200


def _mock_response(message: str) -> str:
    """Simple keyword-based fallback when no OpenAI key is configured."""
    msg = message.lower()
    if any(w in msg for w in ["acne", "pimple", "breakout"]):
        return (
            "Acne is a common skin condition. Keep the area clean, avoid touching your face, "
            "use non-comedogenic products, and consult a dermatologist if severe."
        )
    if any(w in msg for w in ["eczema", "itching", "rash"]):
        return (
            "Eczema causes inflamed, itchy skin. Moisturize regularly, avoid known triggers, "
            "and use fragrance-free products. A dermatologist can recommend appropriate treatment."
        )
    if any(w in msg for w in ["melanoma", "mole", "cancer"]):
        return (
            "If you're concerned about a mole or skin lesion, please consult a dermatologist immediately. "
            "Early detection is critical for melanoma. Use the ABCDE rule: Asymmetry, Border, Color, Diameter, Evolving."
        )
    return (
        "Thank you for your question. I'm DermAI, your skin health assistant. "
        "For any specific skin concerns, I always recommend consulting a certified dermatologist. "
        "Is there anything general about skin health I can help you with?"
    )
