from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse

router = APIRouter()

@router.get("", response_model=List[AlertResponse])
async def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.generated_at.desc()).limit(100).all()
    return alerts

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
