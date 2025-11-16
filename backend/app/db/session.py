from __future__ import annotations

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, scoped_session, sessionmaker

_engine: Engine | None = None
_session_factory: scoped_session | None = None


def _set_sqlite_pragma(dbapi_conn, connection_record):
    """Configure SQLite for better concurrency and performance."""
    # Enable WAL mode for better concurrency (allows concurrent reads)
    dbapi_conn.execute("PRAGMA journal_mode=WAL")
    # Increase timeout for busy database (default is 5 seconds)
    dbapi_conn.execute("PRAGMA busy_timeout=30000")  # 30 seconds
    # Enable foreign keys
    dbapi_conn.execute("PRAGMA foreign_keys=ON")
    # Optimize for performance
    dbapi_conn.execute("PRAGMA synchronous=NORMAL")  # Faster than FULL, safer than OFF
    dbapi_conn.execute("PRAGMA cache_size=-64000")  # 64MB cache
    dbapi_conn.execute("PRAGMA temp_store=MEMORY")


def init_engine(database_url: str) -> Engine:
    """Initialize (or retrieve) the global SQLAlchemy engine."""
    global _engine, _session_factory

    if _engine is not None and str(_engine.url) == database_url:
        return _engine

    if _session_factory is not None:
        _session_factory.remove()

    # Configure SQLite-specific settings for better concurrency
    connect_args = {}
    if database_url.startswith("sqlite"):
        connect_args = {
            "check_same_thread": False,  # Allow multi-threaded access
            "timeout": 30.0,  # 30 second timeout for locked database
        }
        # Use pool_pre_ping to verify connections before using them
        _engine = create_engine(
            database_url,
            future=True,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=3600,  # Recycle connections after 1 hour
        )
        # Set SQLite pragmas on connection
        event.listen(_engine, "connect", _set_sqlite_pragma)
    else:
        _engine = create_engine(database_url, future=True, pool_pre_ping=True)
    
    _session_factory = scoped_session(
        sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    )
    return _engine


def get_session() -> Session:
    if _session_factory is None:
        raise RuntimeError("Database engine has not been initialized.")
    return _session_factory()


def shutdown_session(_: object | None = None) -> None:
    if _session_factory is not None:
        _session_factory.remove()


