from pydantic import BaseModel
from datetime import datetime

class AlertResponse(BaseModel):
    alert_id: str
    event_id: str
    alert_level: str
    title: str
    message: str
    risk_score: float
    generated_at: datetime
    language: str

    class Config:
        from_attributes = True
