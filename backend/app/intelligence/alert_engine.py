from typing import Dict, Any, Optional, List
import uuid
from datetime import datetime, timedelta

class AlertEngine:
    """
    Generates alerts based on risk levels and thresholds.
    """

    TRANSLATIONS = {
        "en": {
            "title": "{event_type} Alert for {location}",
            "action": "Please stay safe and follow local guidelines."
        },
        "ta": {
            "title": "{location} க்கான {event_type} எச்சரிக்கை",
            "action": "தயவுசெய்து பாதுகாப்பாக இருங்கள் மற்றும் உள்ளூர் வழிகாட்டுதல்களைப் பின்பற்றவும்."
        },
        "hi": {
            "title": "{location} के लिए {event_type} अलर्ट",
            "action": "कृपया सुरक्षित रहें और स्थानीय दिशानिर्देशों का पालन करें।"
        }
    }

    # In-memory store for prototype to prevent duplicate alerts within 1 hour
    # Format: { "event_id_alert_level": last_alert_time }
    _alert_history: Dict[str, datetime] = {}

    @classmethod
    def should_alert(cls, event: Dict[str, Any], context: Dict[str, Any] = None) -> bool:
        if context is None:
            context = {}
            
        risk_level = event.get("risk_level", "LOW")
        confidence = event.get("evidence_confidence", 0.0)
        report_growth = context.get("report_growth_rate", 0.0)
        
        if risk_level == "CRITICAL":
            return True
        if risk_level == "HIGH" and confidence >= 70.0:
            return True
        if risk_level == "MODERATE" and report_growth > 3.0:
            return True
            
        return False

    @classmethod
    def generate_alerts(cls, event: Dict[str, Any], context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Generates alerts in multiple languages if thresholds are met.
        """
        if not cls.should_alert(event, context):
            return []
            
        event_id = event.get("event_id")
        risk_level = event.get("risk_level")
        
        # Check for duplicates
        dedup_key = f"{event_id}_{risk_level}"
        last_alert_time = cls._alert_history.get(dedup_key)
        now = datetime.utcnow()
        
        if last_alert_time and (now - last_alert_time) < timedelta(hours=1):
            return [] # Skip, already alerted within last hour
            
        cls._alert_history[dedup_key] = now
        
        alerts = []
        event_type = event.get("event_type", "EVENT")
        location = "Unknown"
        # Extract city from observations if possible, else use coords
        # Since event doesn't directly have city, we can just use "Affected Area"
        
        risk_score = event.get("risk_score", 0.0)
        confidence = event.get("evidence_confidence", 0.0)
        
        for lang in ["en", "ta", "hi"]:
            trans = cls.TRANSLATIONS.get(lang, cls.TRANSLATIONS["en"])
            title = trans["title"].format(event_type=event_type, location="Affected Area")
            message = f"Risk Score: {risk_score}. Confidence: {confidence}%. {trans['action']}"
            
            alerts.append({
                "alert_id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
                "event_id": event_id,
                "alert_level": risk_level,
                "title": title,
                "message": message,
                "risk_score": risk_score,
                "language": lang
            })
            
        return alerts
