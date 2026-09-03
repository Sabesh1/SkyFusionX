from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BaseKafkaEvent(BaseModel):
    event_id: str
    source: str
    source_event_id: str
    timestamp: datetime
    city: str
    state: str
    latitude: float
    longitude: float
    event_type: str = "OTHER"
    description: str = ""
    verification_status: str = "UNVERIFIED"

class WeatherObservationEvent(BaseKafkaEvent):
    source_type: str = "weather_api"

class CitizenReportEvent(BaseKafkaEvent):
    source_type: str = "citizen"
    severity: int = 1
