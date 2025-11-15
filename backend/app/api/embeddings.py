from flask import Blueprint, request, jsonify, current_app
from ..services.embeddings import process_legislation_file
import logging

bp = Blueprint("embeddings", __name__, url_prefix="/api/embeddings")
logger = logging.getLogger(__name__)

@bp.route("/upload", methods=["POST"])
def upload_legislation():
    """Upload legislation file and create embeddings."""
    if "file" not in request.files:
        return jsonify({"error": "no file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "invalid filename"}), 400
    
    try:
        result = process_legislation_file(file, file.filename)
        return jsonify({
            "status": "ok",
            "filename": result["filename"],
            "chunks": result["num_chunks"],
            "text_length": result["text_length"],
        }), 200
    except Exception as e:
        logger.exception("Upload failed")
        return jsonify({"error": str(e)}), 500