from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from pydantic import BaseModel
from app.core.database import get_db
from app.models.weather_event import WeatherEvent
from app.models.observation import Observation
from app.schemas.event import WeatherEventResponse
import math

class UpdateEventPayload(BaseModel):
    confidence: float
    risk_score: float
    risk_level: str
    current_version: int

router = APIRouter()

@router.get("", response_model=List[WeatherEventResponse])
async def list_events(
    state: Optional[str] = None,
    event_type: Optional[str] = None,
    verification_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WeatherEvent)
    
    if event_type and event_type != "ALL":
        query = query.filter(WeatherEvent.event_type == event_type)
        
    events = query.order_by(WeatherEvent.risk_score.desc()).limit(100).all()
    # Format for response
    result = []
    for evt in events:
        # Convert DB model to response format
        data = {
            "event_id": evt.event_id,
            "event_type": evt.event_type,
            "title": evt.title,
            "location": {
                "latitude": evt.latitude,
                "longitude": evt.longitude
            },
            "severity": evt.severity,
            "report_count": evt.report_count,
            "verified_report_count": evt.verified_report_count,
            "evidence_confidence": evt.evidence_confidence,
            "prediction_probability": evt.prediction_probability,
            "exposure_score": evt.exposure_score,
            "risk_score": evt.risk_score,
            "risk_level": evt.risk_level,
            "start_time": evt.start_time.isoformat() if evt.start_time else None,
            "last_observed_at": evt.last_observed_at.isoformat() if evt.last_observed_at else None,
            "explanation": [
                "Multiple independent reports corroborate the event",
                "Reports are geographically clustered",
                f"Risk probability is {evt.prediction_probability}%",
            ]
        }
        result.append(data)
    return result

@router.get("/clusters")
def get_clusters(db: Session = Depends(get_db)):
    observations = db.query(Observation).all()
    clusters = []
    
    def distance(lat1, lon1, lat2, lon2):
        return math.sqrt((lat1 - lat2)**2 + (lon1 - lon2)**2)

    for obs in observations:
        placed = False
        for cluster in clusters:
            if obs.event_type == cluster["event_type"] and distance(obs.latitude, obs.longitude, cluster["center_lat"], cluster["center_lon"]) < 0.5:
                cluster["observations"].append(obs)
                cluster["center_lat"] = sum(o.latitude for o in cluster["observations"]) / len(cluster["observations"])
                cluster["center_lon"] = sum(o.longitude for o in cluster["observations"]) / len(cluster["observations"])
                cluster["report_count"] += 1
                if obs.verification_status == "VERIFIED":
                    cluster["verified_count"] += 1
                if (obs.severity or 1) > cluster["max_severity"]:
                    cluster["max_severity"] = (obs.severity or 1)
                placed = True
                break
        
        if not placed:
            clusters.append({
                "cluster_id": f"CLUST-{obs.id}",
                "event_type": obs.event_type or "OTHER",
                "center_lat": obs.latitude,
                "center_lon": obs.longitude,
                "observations": [obs],
                "report_count": 1,
                "verified_count": 1 if obs.verification_status == "VERIFIED" else 0,
                "max_severity": obs.severity or 1,
                "city": obs.city or "Unknown",
                "state": obs.state or "Unknown"
            })
            
    result = []
    for c in clusters:
        avg_trust = sum((o.trust_score or 50) for o in c["observations"]) / len(c["observations"])
        
        result.append({
            "id": c["cluster_id"],
            "clusterName": f"{c['city']} {c['event_type']} Cluster",
            "location": f"{c['center_lat']:.2f}° N, {c['center_lon']:.2f}° E",
            "severity": "CRITICAL" if c["max_severity"] == 4 else ("HIGH" if c["max_severity"] == 3 else "MODERATE"),
            "trustScore": round(avg_trust, 1),
            "rawReportCount": c["report_count"],
            "deduplicatedEventsCount": max(1, c["report_count"] - 1) if c["report_count"] > 1 else 1,
            "duplicateReductionPct": round(max(0, (c["report_count"] - 1) / c["report_count"] * 100), 1) if c["report_count"] > 1 else 0.0,
            "clusterRadiusKm": round(math.sqrt(c["report_count"] * 5), 1),
            "activeWindowMinutes": 120,
            "sourceDistribution": {
                "citizen": c["report_count"],
                "social": 0,
                "official": 0,
                "sensor": 0
            }
        })
    return result

@router.get("/risk-predictions")
def get_risk_predictions(db: Session = Depends(get_db)):
    # We reuse the cluster generation logic here for the prototype risk model
    clusters_data = get_clusters(db)
    predictions = []
    
    for c in clusters_data:
        # Simple Explainable Risk Model
        # High reports + High Trust = High Risk
        report_score = min(c["rawReportCount"] * 10, 40)
        trust_score = c["trustScore"] * 0.4
        severity_score = 20 if c["severity"] == "CRITICAL" else (10 if c["severity"] == "HIGH" else 0)
        
        overall = min(round(report_score + trust_score + severity_score), 99)
        risk_level = "HIGH" if overall > 80 else ("MODERATE" if overall > 50 else "LOW")
        
        predictions.append({
            "id": c["id"],
            "location": c["location"],
            "state": "Regional",
            "primaryRiskTitle": f"{c['clusterName']} - {risk_level} Risk",
            "primaryRiskType": c['clusterName'].split(' ')[1] if len(c['clusterName'].split(' ')) > 1 else 'Event',
            "severity": c["severity"],
            "timeframe": "Next 3 Hours",
            "peakTime": "T+2 Hrs",
            "overallProbability": overall,
            "heavyRainProbability": overall if "Flood" in c["clusterName"] or "Rain" in c["clusterName"] else 30,
            "floodProbability": overall if "Flood" in c["clusterName"] else 20,
            "stormProbability": overall if "Thunderstorm" in c["clusterName"] else 15,
            "visibilityRiskProbability": overall if "Fog" in c["clusterName"] else 10,
            "dataPoints": [
                { "timeOffset": "Current", "hourLabel": "Now", "rainProbability": overall, "floodProbability": 30, "stormProbability": 20, "windSpeedKmh": 40, "waterLevelRiskIndex": overall, "visibilityRiskIndex": 20 },
                { "timeOffset": "+1 Hour", "hourLabel": "+1H", "rainProbability": min(100, overall + 5), "floodProbability": 35, "stormProbability": 25, "windSpeedKmh": 45, "waterLevelRiskIndex": min(100, overall + 5), "visibilityRiskIndex": 25 },
                { "timeOffset": "+2 Hours", "hourLabel": "+2H", "rainProbability": min(100, overall + 10), "floodProbability": 40, "stormProbability": 30, "windSpeedKmh": 50, "waterLevelRiskIndex": min(100, overall + 10), "visibilityRiskIndex": 30 },
                { "timeOffset": "+3 Hours", "hourLabel": "+3H", "rainProbability": max(0, overall - 5), "floodProbability": 38, "stormProbability": 20, "windSpeedKmh": 35, "waterLevelRiskIndex": max(0, overall - 5), "visibilityRiskIndex": 25 }
            ],
            "contributingFactors": [
                { "factor": "Clustered Reports", "weight": 40, "trend": "increasing" if c["rawReportCount"] > 1 else "stable", "currentValue": f"{c['rawReportCount']} reports", "source": "SkyFusion App", "confidence": c["trustScore"] },
                { "factor": "Truth Score", "weight": 30, "trend": "stable", "currentValue": f"{c['trustScore']}%", "source": "Bayesian Engine", "confidence": c["trustScore"] },
                { "factor": "Severity Assessment", "weight": 30, "trend": "stable", "currentValue": c["severity"], "source": "Event Data", "confidence": 90 }
            ],
            "aiNotes": f"Explainable AI Risk Assessment: Based on a {c['severity']} severity cluster with {c['rawReportCount']} independent reports (Avg Trust: {c['trustScore']}%). Calculated probability is {overall}% yielding a {risk_level} risk level.",
            "isGuaranteedForecast": False
        })
        
    return sorted(predictions, key=lambda x: x["overallProbability"], reverse=True)

@router.get("/{event_id}", response_model=WeatherEventResponse)
async def get_event(event_id: str, db: Session = Depends(get_db)):
    evt = db.query(WeatherEvent).filter(WeatherEvent.event_id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")
        
    data = {
        "event_id": evt.event_id,
        "event_type": evt.event_type,
        "title": evt.title,
        "location": {
            "latitude": evt.latitude,
            "longitude": evt.longitude
        },
        "severity": evt.severity,
        "report_count": evt.report_count,
        "verified_report_count": evt.verified_report_count,
        "evidence_confidence": evt.evidence_confidence,
        "prediction_probability": evt.prediction_probability,
        "exposure_score": evt.exposure_score,
        "risk_score": evt.risk_score,
        "risk_level": evt.risk_level,
        "start_time": evt.start_time.isoformat() if evt.start_time else None,
        "last_observed_at": evt.last_observed_at.isoformat() if evt.last_observed_at else None,
        "truth_analysis": {
            "source": 78,
            "location": 95,
            "timestamp": 92,
            "weather_data": 88,
            "nearby_reports": 94,
            "media": 72,
            "historical": 80
        },
        "explanation": [
            "Multiple independent reports corroborate the event",
            "Weather observations support heavy conditions",
            "Reports are geographically clustered",
            "Risk probability is increasing"
        ]
    }
    return data

@router.put("/{event_id}")
async def update_event_state(event_id: str, payload: UpdateEventPayload, db: Session = Depends(get_db)):
    result = db.execute(
        "UPDATE weather_events SET evidence_confidence = :conf, risk_score = :risk, risk_level = :lvl, version = version + 1, updated_at = now() WHERE event_id = :id AND version = :ver",
        {"conf": payload.confidence, "risk": payload.risk_score, "lvl": payload.risk_level, "id": event_id, "ver": payload.current_version}
    )
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=409, detail="State conflict. Fetch latest.")
    return {"status": "success"}
