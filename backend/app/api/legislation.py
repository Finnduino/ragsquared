from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select

from ..db.session import get_session
from ..logging_config import get_logger
from ..services.embeddings import process_legislation_file
from ..db.models import Legislation, LegislationChunk
from ..config.settings import AppConfig

bp = Blueprint("legislation", __name__, url_prefix="/api/legislation")
logger = get_logger(__name__)


@bp.route("/upload", methods=["POST"])
def upload_legislation() -> tuple[dict, int]:
    """Upload legislation file, create embeddings, and store in DB."""
    if "file" not in request.files:
        return jsonify({"error": "no file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "invalid filename"}), 400

    try:
        db_session = get_session()
        # Get config - ensure .env is loaded (it should be from app factory)
        config = AppConfig()
        
        # Validate API key is set
        if not config.openrouter_api_key and not config.llm_api_key:
            logger.error("Missing API key: OPENROUTER_API_KEY or LLM_API_KEY must be set")
            return jsonify({
                "error": "Configuration error: OPENROUTER_API_KEY or LLM_API_KEY must be set in environment variables"
            }), 500
        
        if not config.embedding_model:
            logger.error("Missing embedding model: EMBEDDING_MODEL must be set")
            return jsonify({
                "error": "Configuration error: EMBEDDING_MODEL must be set in environment variables"
            }), 500
        
        result = process_legislation_file(file, file.filename, db_session, config)
        return jsonify({
            "status": "ok",
            "id": result["id"],
            "filename": result["filename"],
            "chunks": result["num_chunks"],
            "text_length": result["text_length"],
        }), 200
    except ValueError as e:
        # Configuration or validation errors
        logger.exception("Upload failed - validation error")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.exception("Upload failed")
        return jsonify({"error": str(e)}), 500


@bp.route("/list", methods=["GET"])
def list_legislations() -> tuple[dict, int]:
    """List all uploaded legislations."""
    try:
        db_session = get_session()
        result = db_session.execute(select(Legislation))
        legislations = result.scalars().all()
        return jsonify({
            "status": "ok",
            "legislations": [
                {
                    "id": l.id,
                    "filename": l.filename,
                    "chunks": l.num_chunks,
                    "uploaded_at": l.created_at.isoformat() if l.created_at else None,
                }
                for l in legislations
            ]
        }), 200
    except Exception as e:
        logger.exception("List failed")
        return jsonify({"error": str(e)}), 500


@bp.route("/<int:legislation_id>/chunks", methods=["GET"])
def get_legislation_chunks(legislation_id: int) -> tuple[dict, int]:
    """Get chunks for a specific legislation (for cross-reference)."""
    try:
        db_session = get_session()
        result = db_session.execute(
            select(LegislationChunk).where(LegislationChunk.legislation_id == legislation_id)
        )
        chunks = result.scalars().all()
        return jsonify({
            "status": "ok",
            "chunks": [
                {
                    "id": c.id,
                    "index": c.chunk_index,
                    "text": c.text,
                }
                for c in chunks
            ]
        }), 200
    except Exception as e:
        logger.exception("Get chunks failed")
        return jsonify({"error": str(e)}), 500

