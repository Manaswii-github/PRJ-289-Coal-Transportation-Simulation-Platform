from sqlalchemy import Column, BigInteger, String, Integer, Numeric, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Rake(Base):

    __tablename__ = "rakes"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    rake_id = Column(
        String(100),
        nullable=False,
        unique=True
    )

    fnr = Column(
        String(100),
        nullable=True
    )

    commodity = Column(
        String(100),
        nullable=True,
        default="COAL"
    )

    coal_grade = Column(
        String(50),
        nullable=True
    )

    wagon_count = Column(
        Integer,
        nullable=True
    )

    tonnage = Column(
        Numeric(12, 2),
        nullable=True
    )

    origin = Column(
        String(255),
        nullable=True
    )

    destination = Column(
        String(255),
        nullable=True
    )

    status = Column(
        String(50),
        nullable=True,
        default="UNKNOWN"
    )

    current_latitude = Column(
        Numeric(10, 7),
        nullable=True
    )

    current_longitude = Column(
        Numeric(10, 7),
        nullable=True
    )

    speed = Column(
        Numeric(8, 2),
        nullable=True
    )

    last_updated = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=True,
        server_default=func.current_timestamp()
    )

    updated_at = Column(
        DateTime,
        nullable=True,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )