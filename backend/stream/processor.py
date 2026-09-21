import asyncio
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
import uuid

from stream.app import stream_client
from stream import topics
from app.intelligence.truth_engine import TruthEngine, TruthEvidence
from app.intelligence.classifier import Classifier
from app.intelligence.fusion_engine import FusionEngine
from app.intelligence.clustering_engine import ClusteringEngine
from app.intelligence.prediction_engine import PredictionEngine
from app.intelligence.risk_engine import RiskEngine
from app.intelligence.alert_engine import AlertEngine
from app.core.database import SessionLocal
from app.models.observation import Observation
from app.models.weather_event import WeatherEvent
from app.models.alert import Alert
from app.api.stream import push_to_clients

logger = logging.getLogger(__name__)


async def get_recent_observations(db, minutes: int = 30) -> List[Dict[str, Any]]:
    """Fetch recent verified observations from database instead of memory."""
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)
    result = db.query(Observation).filter(
        Observation.observed_at > cutoff,
        Observation.verification_status.in_(["HIGH_CONFIDENCE", "MEDIUM_HIGH_CONFIDENCE", "VERIFIED"])
    ).order_by(Observation.observed_at.desc()).all()

    return [
        {
            "observation_id": obs.id,
            "source": obs.source,
            "source_event_id": obs.source_event_id,
            "occurred_at": obs.observed_at.isoformat(),
            "content": obs.content,
            "latitude": obs.latitude,
            "longitude": obs.longitude,
            "city": obs.city,
            "state": obs.state,
            "event_type": obs.event_type,
            "severity": obs.severity,
            "trust_score": obs.trust_score,
            "verification_status": obs.verification_status,
            "is_mock": obs.is_mock,
        }
        for obs in result
    ]


async def process_raw(msg: Dict[str, Any]):
    """ Stage 2: CLEAN """
    # Clean timestamp, validate coords
    if 'latitude' not in msg or 'longitude' not in msg:
        await stream_client.send(topics.TOPIC_DLQ, msg)
        return
        
    cleaned = msg.copy()
    cleaned['schema_version'] = "1.0"
    cleaned['processed_at'] = datetime.utcnow().isoformat()
    # Simple duplicate detection could go here (content hash)
    await stream_client.send(topics.TOPIC_CLEANED, cleaned)

async def process_cleaned(msg: Dict[str, Any]):
    """ Stage 3: VERIFY (Truth Engine) """
    evidence = TruthEvidence(
        source=msg.get("source_reliability", 50),
        location=msg.get("location_plausibility", 50),
        timestamp=msg.get("temporal_consistency", 50),
        weather_data=msg.get("weather_agreement", 50),
        nearby_reports=msg.get("nearby_corroboration", 50),
        media=msg.get("media_quality", 50),
        historical=msg.get("historical_pattern_match", 50),
    )
    truth_result = TruthEngine().calculate(evidence)

    verified = msg.copy()
    verified['trust_score'] = truth_result.overall
    verified['verification_status'] = truth_result.status
    verified['truth_analysis'] = dict(truth_result.factors)
    verified['requires_human_review'] = truth_result.requires_human_review

    await stream_client.send(topics.TOPIC_VERIFIED, verified)

async def process_verified(msg: Dict[str, Any]):
    """ Stage 4: CLASSIFY """
    content = msg.get('content', '')
    classification = Classifier.classify(content)
    
    classified = msg.copy()
    classified['event_type'] = classification['event_type']
    classified['severity'] = classification['severity']
    
    # Save to database
    db = SessionLocal()
    try:
        obs = Observation(
            id=classified.get('observation_id', str(uuid.uuid4())),
            source=classified.get('source'),
            source_event_id=classified.get('source_event_id', str(uuid.uuid4())),
            observed_at=datetime.fromisoformat(classified.get('occurred_at', datetime.utcnow().isoformat()).replace("Z", "+00:00")),
            ingested_at=datetime.utcnow(),
            content=classified.get('content'),
            latitude=classified.get('latitude'),
            longitude=classified.get('longitude'),
            city=classified.get('city'),
            state=classified.get('state'),
            event_type=classified.get('event_type'),
            severity=classified.get('severity'),
            trust_score=classified.get('trust_score'),
            verification_status=classified.get('verification_status'),
            is_mock=classified.get('is_mock', False),
            raw_payload=classified
        )
        # Using a simple merge for prototype to avoid constraint violations on re-runs
        db.merge(obs)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save observation to DB: {e}")
        db.rollback()
    finally:
        db.close()
        
    await stream_client.send(topics.TOPIC_CLASSIFIED, classified)

    # Trigger clustering from database (replaces in-memory array)
    await trigger_clustering()

async def trigger_clustering():
    """ Stage 5 & 6: FUSE & CLUSTER """
    db = SessionLocal()
    try:
        recent_obs = await get_recent_observations(db, minutes=30)
    finally:
        db.close()

    if not recent_obs:
        return

    # Cluster observations
    events = ClusteringEngine.cluster(recent_obs)

    for event in events:
        # Fetch weather for the cluster centroid to use in fusion
        weather_context = None
        db_weather = SessionLocal()
        try:
            from app.services.location_service import fetch_and_store_weather
            location_mock = {
                "lat": event["latitude"],
                "lng": event["longitude"],
                "location_id": f"CLUST-{abs(hash(str(event.get('latitude', 0)) + '_' + str(event.get('longitude', 0)))) % 100000}"
            }
            res = fetch_and_store_weather(location_mock, db_weather)
            if res:
                weather_context = res
        except Exception as e:
            logger.error(f"Failed to fetch cluster weather for fusion: {e}")
        finally:
            db_weather.close()

        # Fuse observations in this cluster
        fusion_result = FusionEngine.fuse(event["observations"], weather_context)

        event.update(fusion_result)
        # Pass weather context downstream to avoid re-fetching in PREDICT
        event["weather_context"] = weather_context

        # We need an event ID that is stable for the same geographic area
        # For prototype, we generate one deterministically based on cluster lat/lon roughly
        lat_r = round(event["latitude"], 2)
        lon_r = round(event["longitude"], 2)
        event_id = f"EVT-{abs(hash(f'{event['event_type']}_{lat_r}_{lon_r}')) % 100000}"
        event["event_id"] = event_id

        await stream_client.send(topics.TOPIC_CLUSTERED, event)

async def process_clustered(msg: Dict[str, Any]):
    """ Stage 7: PREDICT """
    lat = msg.get("latitude")
    lon = msg.get("longitude")
    
    weather = msg.get("weather_context", {})
    if not weather and lat is not None and lon is not None:
        try:
            from app.services.location_service import fetch_and_store_weather
            db = SessionLocal()
            location_mock = {
                "lat": lat,
                "lng": lon,
                "location_id": f"CLUST-{abs(hash(f'{lat}_{lon}')) % 100000}"
            }
            res = fetch_and_store_weather(location_mock, db)
            if res:
                weather = res
            db.close()
        except Exception as e:
            logger.error(f"Failed to fetch cluster weather: {e}")

    context = {
        "report_growth_rate": msg.get("report_count", 1) * 2.0,
        "rainfall_1h": weather.get("rainfall_mm", 0.0),
        "wind_speed": weather.get("wind_speed_kmh", 0.0),
        "temperature": weather.get("temperature_c", 25.0),
        "historical_risk": 50.0
    }
    prob = PredictionEngine.predict(msg, context)
    
    predicted = msg.copy()
    predicted['prediction_probability'] = prob
    
    await stream_client.send(topics.TOPIC_PREDICTED, predicted)

async def process_predicted(msg: Dict[str, Any]):
    """ Stage 8: RISK """
    lat = msg.get("latitude", 20.0)
    lon = msg.get("longitude", 80.0)
    
    # Deterministic population density based on coordinates for prototype (between 100 and 15000)
    # In production, this would query a census/demographics API.
    mock_pop_density = 100 + (abs(hash(f"pop_{lat:.1f}_{lon:.1f}")) % 14900)
    
    context = {"population_density": mock_pop_density}
    risk_res = RiskEngine.calculate_risk(msg, context)
    
    risk_event = msg.copy()
    risk_event.update(risk_res)
    
    # Save Event to DB
    db = SessionLocal()
    try:
        evt = db.query(WeatherEvent).filter(WeatherEvent.event_id == risk_event["event_id"]).first()
        if not evt:
            evt = WeatherEvent(event_id=risk_event["event_id"])
            
        evt.event_type = risk_event.get("event_type")
        evt.title = f"{risk_event.get('event_type')} Risk"
        evt.severity = risk_event.get("severity")
        evt.status = "ACTIVE"
        evt.start_time = datetime.fromisoformat(risk_event.get("start_time"))
        evt.last_observed_at = datetime.fromisoformat(risk_event.get("last_observed_at"))
        evt.latitude = risk_event.get("latitude")
        evt.longitude = risk_event.get("longitude")
        evt.report_count = risk_event.get("report_count")
        evt.verified_report_count = risk_event.get("verified_report_count")
        # Ensure we write evidence_confidence mapped to fusion_confidence for legacy, and actual fusion_confidence
        evt.evidence_confidence = risk_event.get("evidence_confidence", risk_event.get("fusion_confidence", 0.0))
        evt.fusion_confidence = risk_event.get("fusion_confidence")
        evt.weather_support_flag = risk_event.get("weather_support_flag")
        evt.contradiction_flag = risk_event.get("contradiction_flag")
        
        import json
        evt.supporting_factors = json.dumps(risk_event.get("supporting_factors", []))
        
        evt.prediction_probability = risk_event.get("prediction_probability")
        evt.exposure_score = risk_event.get("exposure_score")
        evt.risk_score = risk_event.get("risk_score")
        evt.risk_level = risk_event.get("risk_level")
        
        db.add(evt)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save event to DB: {e}")
        db.rollback()
    finally:
        db.close()
        
    # Also broadcast for SSE
    await stream_client.send(topics.TOPIC_RISK, risk_event)
    
    # Broadcast to SSE clients directly
    await push_to_clients({
        "event_id": risk_event["event_id"],
        "version": 4, # As per prompt requirement
        "risk_score": risk_event["risk_score"],
        "risk_level": risk_event["risk_level"],
        "timestamp": datetime.utcnow().isoformat()
    })
    
async def process_risk(msg: Dict[str, Any]):
    """ Stage 9 & 10: ALERTS """
    alerts = AlertEngine.generate_alerts(msg)
    
    db = SessionLocal()
    for alert_data in alerts:
        # Save alert
        try:
            alert = Alert(
                alert_id=alert_data["alert_id"],
                event_id=alert_data["event_id"],
                alert_level=alert_data["alert_level"],
                title=alert_data["title"],
                message=alert_data["message"],
                risk_score=alert_data["risk_score"],
                language=alert_data["language"]
            )
            db.add(alert)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to save alert: {e}")
            db.rollback()
            
        await stream_client.send(topics.TOPIC_ALERTS, alert_data)
    db.close()

async def start_processors():
    """ Starts all consumers """
    await stream_client.connect()
    
    asyncio.create_task(stream_client.consume(topics.TOPIC_RAW, process_raw))
    asyncio.create_task(stream_client.consume(topics.TOPIC_CLEANED, process_cleaned))
    asyncio.create_task(stream_client.consume(topics.TOPIC_VERIFIED, process_verified))
    # Note: TOPIC_CLASSIFIED triggers clustering directly for prototype simplicity
    asyncio.create_task(stream_client.consume(topics.TOPIC_CLUSTERED, process_clustered))
    asyncio.create_task(stream_client.consume(topics.TOPIC_PREDICTED, process_predicted))
    asyncio.create_task(stream_client.consume(topics.TOPIC_RISK, process_risk))
    
    logger.info("Stream processors started.")
