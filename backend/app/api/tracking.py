from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.rake import Rake
from app.models.telemetry import RakeTelemetry
from app.schemas.tracking import (
    RakeResponse,
    TelemetryResponse,
    TelemetryCreate
)
from app.services.websocket_manager import manager


router = APIRouter(
    prefix="/api/rakes",
    tags=["Rakes"]
)


@router.get(
    "",
    response_model=list[RakeResponse]
)
def get_rakes(
    db: Session = Depends(get_db)
):
    return (
        db.query(Rake)
        .order_by(Rake.updated_at.desc())
        .all()
    )


@router.get(
    "/{rake_id}",
    response_model=RakeResponse
)
def get_rake(
    rake_id: str,
    db: Session = Depends(get_db)
):
    rake = (
        db.query(Rake)
        .filter(Rake.rake_id == rake_id)
        .first()
    )

    if not rake:
        raise HTTPException(
            status_code=404,
            detail="Rake not found"
        )

    return rake


@router.get(
    "/{rake_id}/telemetry",
    response_model=list[TelemetryResponse]
)
def get_rake_telemetry(
    rake_id: str,
    db: Session = Depends(get_db)
):
    rake = (
        db.query(Rake)
        .filter(Rake.rake_id == rake_id)
        .first()
    )

    if not rake:
        raise HTTPException(
            status_code=404,
            detail="Rake not found"
        )

    telemetry = (
        db.query(RakeTelemetry)
        .filter(
            RakeTelemetry.rake_id == rake.id
        )
        .order_by(
            RakeTelemetry.recorded_at.asc()
        )
        .all()
    )

    return telemetry


@router.post(
    "/{rake_id}/telemetry",
    response_model=TelemetryResponse
)
async def add_rake_telemetry(
    rake_id: str,
    telemetry_data: TelemetryCreate,
    db: Session = Depends(get_db)
):
    rake = (
        db.query(Rake)
        .filter(Rake.rake_id == rake_id)
        .first()
    )

    if not rake:
        raise HTTPException(
            status_code=404,
            detail="Rake not found"
        )

    telemetry = RakeTelemetry(
        rake_id=rake.id,
        latitude=telemetry_data.latitude,
        longitude=telemetry_data.longitude,
        speed=telemetry_data.speed,
        recorded_at=telemetry_data.recorded_at,
        source=telemetry_data.source
    )

    db.add(telemetry)

    rake.current_latitude = telemetry_data.latitude
    rake.current_longitude = telemetry_data.longitude
    rake.speed = telemetry_data.speed
    rake.last_updated = telemetry_data.recorded_at

    db.commit()
    db.refresh(telemetry)
    db.refresh(rake)

    await manager.broadcast({
        "type": "RAKE_POSITION_UPDATE",
        "rake": {
            "id": rake.id,
            "rake_id": rake.rake_id,
            "fnr": rake.fnr,
            "commodity": rake.commodity,
            "coal_grade": rake.coal_grade,
            "wagon_count": rake.wagon_count,
            "tonnage": float(rake.tonnage)
            if rake.tonnage is not None
            else None,
            "origin": rake.origin,
            "destination": rake.destination,
            "status": rake.status,
            "current_latitude": float(rake.current_latitude),
            "current_longitude": float(rake.current_longitude),
            "speed": float(rake.speed)
            if rake.speed is not None
            else None,
            "last_updated": (
                rake.last_updated.isoformat()
                if rake.last_updated
                else None
            )
        }
    })

    return telemetry


@router.websocket("/ws/live")
async def rake_websocket(websocket: WebSocket):

    await manager.connect(websocket)

    try:

        while True:
            await websocket.receive_text()

    except Exception:

        manager.disconnect(websocket)