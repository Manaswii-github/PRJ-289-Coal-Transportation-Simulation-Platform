from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.database.connection import Base


class RakeTelemetry(Base):

    __tablename__ = "rake_telemetry"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    rake_id = Column(
        BigInteger,
        ForeignKey(
            "rakes.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    latitude = Column(
        Numeric(10, 7),
        nullable=False
    )

    longitude = Column(
        Numeric(10, 7),
        nullable=False
    )

    speed = Column(
        Numeric(8, 2),
        nullable=True
    )

    recorded_at = Column(
        DateTime,
        nullable=False
    )

    source = Column(
        String(100),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=True,
        server_default=func.current_timestamp()
    )