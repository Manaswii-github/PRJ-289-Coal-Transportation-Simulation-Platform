from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import DATABASE_URL


engine = (
    create_engine(DATABASE_URL, pool_pre_ping=True)
    if DATABASE_URL
    else None
)


SessionLocal = (
    sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    if engine is not None
    else None
)


Base = declarative_base()


def get_engine():
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Database is not configured. Set DATABASE_URL in "
                "backend/.env and restart the backend."
            ),
        )

    return engine


def get_db():
    if SessionLocal is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Database is not configured. Set DATABASE_URL in "
                "backend/.env and restart the backend."
            ),
        )

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()