from __future__ import annotations

import threading
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select

from ..db.session import get_session
from ..logging_config import get_logger
from ..services.embeddings import process_legislation_file
from ..services.documents import DocumentUploadError
from ..db.models import Legislation, LegislationChunk
from ..config.settings import AppConfig

bp = Blueprint("legislation", __name__, url_prefix="/api/legislation")
logger = get_logger(__name__)


@bp.route("/upload", methods=["POST"])
def upload_legislation() -> tuple[dict, int]:
    """Upload legislation file, create embeddings, and store in DB.
    
    This operation can take a long time (up to an hour for large files),
    so it runs in a background thread and returns immediately.
    """
    logger.info("Legislation upload request received")
    
    if "file" not in request.files:
        logger.warning("No file in request.files")
        return jsonify({"error": "no file provided"}), 400

    file = request.files["file"]
    logger.info(f"File received: {file.filename}, size: {request.content_length} bytes")
    
    if file.filename == "":
        logger.warning("Empty filename")
        return jsonify({"error": "invalid filename"}), 400

    # Validate configuration before starting background processing
    try:
        config = AppConfig()
        logger.info(f"Data root: {config.data_root}, Embedding model: {config.embedding_model}")
        
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
    except Exception as e:
        logger.exception("Configuration validation failed")
        return jsonify({"error": f"Configuration error: {str(e)}"}), 500
    
    # Save file first (before background processing) so we can access it in the thread
    from pathlib import Path
    from werkzeug.utils import secure_filename
    import tempfile
    import shutil
    
    config = AppConfig()
    # Normalize data_root
    data_root_str = config.data_root.rstrip('/')
    if data_root_str.endswith('/data/data'):
        data_root_str = data_root_str[:-10]
    data_root_path = Path(data_root_str).resolve()
    
    # Create temp file to save uploaded file
    temp_dir = data_root_path / "temp_uploads"
    temp_dir.mkdir(parents=True, exist_ok=True)
    safe_filename = secure_filename(file.filename)
    temp_file_path = temp_dir / f"{secure_filename(file.filename)}"
    
    try:
        # Save file to temp location
        file.save(str(temp_file_path))
        logger.info(f"Saved uploaded file to temp location: {temp_file_path}")
        
        # Capture app instance and file info for background thread
        app = current_app._get_current_object()
        file_path_str = str(temp_file_path)
        original_filename = file.filename
        
        def process_in_background():
            """Background thread function to process legislation file."""
            with app.app_context():
                db_session = get_session()
                config = AppConfig()
                try:
                    logger.info("Starting background processing of legislation file...")
                    # Reopen file from saved location
                    from werkzeug.datastructures import FileStorage
                    with open(file_path_str, 'rb') as f:
                        file_storage = FileStorage(
                            stream=f,
                            filename=original_filename,
                            content_type=file.content_type
                        )
                        result = process_legislation_file(file_storage, original_filename, db_session, config)
                        logger.info(f"Legislation upload successful: {result['filename']}, {result['num_chunks']} chunks")
                except Exception as exc:
                    logger.exception(f"Error processing legislation file in background: {exc}")
                finally:
                    # Clean up temp file
                    try:
                        if Path(file_path_str).exists():
                            Path(file_path_str).unlink()
                            logger.info(f"Cleaned up temp file: {file_path_str}")
                    except Exception as cleanup_err:
                        logger.warning(f"Failed to clean up temp file: {cleanup_err}")
        
        # Start background thread to process the file
        process_thread = threading.Thread(
            target=process_in_background,
            daemon=True,
        )
        process_thread.start()
        logger.info("Started background thread to process legislation file")
        
        # Return immediately - processing happens in background
        return jsonify({
            "status": "processing",
            "message": "File upload accepted. Processing in background. This may take several minutes. Check the legislation list to see when it's complete.",
            "filename": file.filename,
        }), 202  # 202 Accepted - request accepted for processing
    except Exception as e:
        logger.exception("Failed to save uploaded file")
        # Clean up temp file if it was created
        try:
            if temp_file_path.exists():
                temp_file_path.unlink()
        except Exception:
            pass
        return jsonify({"error": f"Failed to save uploaded file: {str(e)}"}), 500


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

