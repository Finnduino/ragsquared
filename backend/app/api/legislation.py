from flask import Blueprint, request, jsonify, current_app
from ..services.embeddings import process_legislation_file
from ..db.session import get_session
import logging

bp = Blueprint("legislation", __name__, url_prefix="/api/legislation")
logger = logging.getLogger(__name__)

@bp.route("/upload", methods=["POST"])
def upload_legislation():
    """Upload legislation file, create embeddings, and store in DB."""
    if "file" not in request.files:
        return jsonify({"error": "no file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "invalid filename"}), 400
    
    try:
        db_session = get_session()
        result = process_legislation_file(file, file.filename, db_session)
        return jsonify({
            "status": "ok",
            "id": result["id"],
            "filename": result["filename"],
            "chunks": result["num_chunks"],
            "text_length": result["text_length"],
        }), 200
    except Exception as e:
        logger.exception("Upload failed")
        return jsonify({"error": str(e)}), 500

@bp.route("/list", methods=["GET"])
def list_legislations():
    """List all uploaded legislations."""
    try:
        db_session = get_session()
        from ..db.models import Legislation
        legislations = db_session.query(Legislation).all()
        return jsonify({
            "status": "ok",
            "legislations": [
                {
                    "id": l.id,
                    "filename": l.filename,
                    "chunks": l.num_chunks,
                    "uploaded_at": l.uploaded_at.isoformat(),
                }
                for l in legislations
            ]
        }), 200
    except Exception as e:
        logger.exception("List failed")
        return jsonify({"error": str(e)}), 500

@bp.route("/<int:legislation_id>/chunks", methods=["GET"])
def get_legislation_chunks(legislation_id):
    """Get chunks for a specific legislation (for cross-reference)."""
    try:
        db_session = get_session()
        from ..db.models import LegislationChunk
        chunks = db_session.query(LegislationChunk).filter_by(legislation_id=legislation_id).all()
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