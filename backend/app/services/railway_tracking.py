from typing import Any, Dict, List, Optional


class RailwayTrackingProvider:
    """
    Interface for railway/rake tracking data.

    A real railway data provider can be connected here later.
    """

    def get_rakes(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def get_rake(self, rake_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def get_telemetry(self, rake_id: str) -> List[Dict[str, Any]]:
        raise NotImplementedError