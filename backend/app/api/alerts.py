from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse

from pydantic import BaseModel
from app.services.gemini_service import translate_alert

router = APIRouter()

# Simple in-memory translation cache to save Gemini API calls:
# Key: "alert_id:language", Value: "Translated text"
translation_cache = {}

class TranslateRequest(BaseModel):
    language: str

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

from app.models.alert import Alert, TranslatedAlert
import uuid

@router.post("/{alert_id}/translate")
async def translate_alert_endpoint(alert_id: str, payload: TranslateRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    target_lang = payload.language
    if target_lang == "en":
        return {"translated_text": alert.message}
        
    # Check DB cache
    cached_translation = db.query(TranslatedAlert).filter(
        TranslatedAlert.alert_id == alert_id,
        TranslatedAlert.language == target_lang
    ).first()
    
    if cached_translation:
        import logging
        logging.getLogger(__name__).info(f"Translation cache hit for alert {alert_id} in {target_lang}")
        return {"translated_text": cached_translation.translated_text}
        
    # Language code mapping to full name for Gemini prompt
    lang_map = {
        "ta": "Tamil",
        "hi": "Hindi",
        "te": "Telugu",
        "kn": "Kannada",
        "ml": "Malayalam",
        "bn": "Bengali",
        "mr": "Marathi"
    }
    
    lang_name = lang_map.get(target_lang, target_lang)
    translated_text = await translate_alert(alert.message, lang_name)
    
    # Check if translation was successful or fallback
    if translated_text == alert.message and target_lang != "en":
        # It means translation failed. Return English but don't cache it so it can retry later.
        return {"translated_text": alert.message, "error": "AI translation unavailable — showing English."}
        
    # Save to DB
    new_translation = TranslatedAlert(
        id=str(uuid.uuid4()),
        alert_id=alert_id,
        language=target_lang,
        translated_text=translated_text
    )
    db.add(new_translation)
    db.commit()
    
    return {"translated_text": translated_text}
