from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.rake import Rake
from app.models.telemetry import RakeTelemetry


class DatabaseTrackingProvider:

    def __init__(self, db: Session):
        self.db = db

    def get_rakes(self) -> List[Rake]:
        return (
            self.db.query(Rake)
            .order_by(Rake.updated_at.desc())
            .all()
        )

    def get_rake(self, rake_id: str) -> Optional[Rake]:
        return (
            self.db.query(Rake)
            .filter(Rake.rake_id == rake_id)
            .first()
        )

    def get_telemetry(self, rake_id: str) -> List[RakeTelemetry]:

        rake = self.get_rake(rake_id)

        if not rake:
            return []

        return (
            self.db.query(RakeTelemetry)
            .filter(
                RakeTelemetry.rake_id == rake.id
            )
            .order_by(
                RakeTelemetry.recorded_at.asc()
            )
            .all()
        )