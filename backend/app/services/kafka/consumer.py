import asyncio
import json
import logging
from aiokafka import AIOKafkaConsumer, TopicPartition
from aiokafka.errors import KafkaConnectionError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.observation import Observation
from app.services.kafka.topics import TOPIC_WEATHER_OBSERVATIONS, TOPIC_CITIZEN_REPORTS
from app.api.stream import push_to_clients

logger = logging.getLogger(__name__)

class KafkaConsumerService:
    def __init__(self):
        self.bootstrap_servers = settings.KAFKA_BOOTSTRAP_SERVERS
        self.consumer = None
        self._running = False
        self._task = None
        
        # ML Models
        import joblib
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        ml_dir = os.path.join(base_dir, "ml", "models")
        
        try:
            self.classifier_model = joblib.load(os.path.join(ml_dir, "classifier_v1.joblib"))
            self.trust_model = joblib.load(os.path.join(ml_dir, "trust_model_v1.joblib"))
            self.ml_loaded = True
            logger.info("Successfully loaded ML models (classifier_v1, trust_model_v1)")
        except Exception as e:
            self.ml_loaded = False
            self.classifier_model = None
            self.trust_model = None
            logger.error(f"Failed to load ML models: {e}. AI intelligence will be skipped.")

    async def start(self):
        self._running = True
        self.consumer = AIOKafkaConsumer(
            TOPIC_WEATHER_OBSERVATIONS,
            TOPIC_CITIZEN_REPORTS,
            bootstrap_servers=self.bootstrap_servers,
            group_id="weather-platform-consumer",
            enable_auto_commit=False,  # We commit manually after DB write
            auto_offset_reset="earliest",
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            retry_backoff_ms=2000
        )
        self._task = asyncio.create_task(self._consume_loop())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        if self.consumer:
            await self.consumer.stop()
            logger.info("Kafka Consumer stopped.")

    async def _consume_loop(self):
        # We will loop forever and attempt to connect
        while self._running:
            try:
                await self.consumer.start()
                logger.info("Kafka Consumer successfully connected and listening.")
                break
            except KafkaConnectionError as e:
                logger.warning(f"Kafka Consumer connection failed: {e}. Retrying in 15 seconds...")
                await asyncio.sleep(15)
            except Exception as e:
                logger.error(f"Unexpected error starting Kafka Consumer: {e}")
                await asyncio.sleep(5)

        if not self._running:
            return

        try:
            async for msg in self.consumer:
                if not self._running:
                    break
                await self._process_message(msg)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Kafka Consumer loop error: {e}")
        finally:
            if self.consumer:
                await self.consumer.stop()

    async def _process_message(self, msg):
        topic = msg.topic
        data = msg.value
        partition = msg.partition
        offset = msg.offset

        logger.info(f"Processing message from {topic} (Partition: {partition}, Offset: {offset})")

        db: Session = SessionLocal()
        success = False
        item_to_push = None

        try:
            # --- AI / ML INFERENCE ---
            import pandas as pd
            
            ml_event_type = data.get("event_type", "OTHER")
            ml_confidence = 0.0
            trust_score = 50.0
            verification_rec = "REQUIRES_HUMAN_REVIEW"
            ml_processed_at = None
            model_version = "none"

            if self.ml_loaded:
                ml_processed_at = datetime.utcnow()
                model_version = "v1"
                description = data.get("description", "")
                
                # 1. Event Classification (Only if description is long enough, else trust incoming structured data)
                if description and len(description.strip()) > 5:
                    probs = self.classifier_model.predict_proba([description])[0]
                    pred_idx = probs.argmax()
                    ml_confidence = float(probs[pred_idx])
                    pred_class = self.classifier_model.classes_[pred_idx]
                    
                    if ml_confidence >= 0.60:
                        ml_event_type = pred_class
                    else:
                        ml_event_type = "OTHER"
                
                # 2. Trust Scoring
                # features: text_length, has_media, source_type, metadata_completeness
                text_len = len(description) if description else 0
                has_media = 1 if data.get("media_url") else 0
                src_type = data.get("source_type", "Citizen")
                # Basic metadata completeness (city + state + lat/lon)
                completeness = 1.0 if data.get("city") and data.get("state") else 0.5
                
                features = pd.DataFrame([{
                    "text_length": text_len,
                    "has_media": has_media,
                    "source_type": src_type,
                    "metadata_completeness": completeness
                }])
                
                # trust model predicts [suspicious=0, reliable=1]
                trust_probs = self.trust_model.predict_proba(features)[0]
                # Prob of reliable class
                reliable_prob = float(trust_probs[1])
                trust_score = round(reliable_prob * 100, 1)
                
                if trust_score >= 80:
                    verification_rec = "HIGH_CONFIDENCE"
                elif trust_score >= 50:
                    verification_rec = "REQUIRES_HUMAN_REVIEW"
                else:
                    verification_rec = "LOW_CONFIDENCE"

            # Phase 5: India Location Intelligence
            from app.services.location_resolver import location_resolver
            
            loc_result = location_resolver.resolve(
                explicit_city=data.get("city"),
                explicit_state=data.get("state"),
                lat=data.get("latitude"),
                lon=data.get("longitude"),
                text=data.get("description", "")
            )
            
            # Map event to DB model or update existing
            obs = db.query(Observation).filter(Observation.source_event_id == data.get("source_event_id")).first()
            if not obs:
                obs = Observation(
                    id=data.get("event_id", data.get("source_event_id")),
                    source=data.get("source"),
                    source_event_id=data.get("source_event_id"),
                    observed_at=datetime.fromisoformat(data.get("timestamp")),
                    ingested_at=datetime.utcnow(),
                    content=data.get("description", ""),
                    latitude=data.get("latitude"),
                    longitude=data.get("longitude"),
                    city=data.get("city"),
                    district=data.get("district", data.get("city")),
                    state=data.get("state"),
                    event_type=data.get("event_type") or "OTHER",
                    severity=data.get("severity", 1),
                    is_mock=False
                )
                db.add(obs)
                
                # Phase 5: Duplicate Detection (only for new reports to save processing)
                from app.services.duplicate_detector import duplicate_detector
                from datetime import timedelta
                
                # Get candidates in the last 2 hours
                time_threshold = datetime.utcnow() - timedelta(hours=duplicate_detector.TIME_WINDOW_HOURS)
                candidates = db.query(Observation).filter(
                    Observation.source == data.get("source"), # usually same source, but can be any
                    Observation.ingested_at >= time_threshold,
                    Observation.id != obs.id
                ).all()
                
                dup_input = {
                    "content": obs.content,
                    "latitude": obs.latitude or loc_result.latitude,
                    "longitude": obs.longitude or loc_result.longitude,
                    "event_type": obs.event_type,
                    "resolved_city": loc_result.city
                }
                
                dup_result = duplicate_detector.detect_duplicate(dup_input, candidates)
                
                if dup_result.is_duplicate:
                    obs.is_duplicate = True
                    obs.duplicate_of_id = dup_result.duplicate_of_id
                    obs.duplicate_similarity = dup_result.similarity
                    obs.duplicate_reason = dup_result.reason
                    obs.duplicate_group_id = dup_result.group_id
                else:
                    # Original report gets its own group ID
                    obs.duplicate_group_id = f"INC-{obs.id[-6:]}" if obs.id else None
            
            # Update Phase 5 Location fields
            obs.resolved_city = loc_result.city
            obs.resolved_district = loc_result.district
            obs.resolved_state = loc_result.state
            obs.resolved_latitude = loc_result.latitude
            obs.resolved_longitude = loc_result.longitude
            obs.location_confidence = loc_result.confidence
            obs.location_method = loc_result.method
            
            # Update verification fields (whether new or existing)
            obs.verification_status = data.get("verification_status", "UNVERIFIED")
            if verification_rec != "REQUIRES_HUMAN_REVIEW": 
                 if obs.verification_status == "PROCESSING":
                     obs.verification_status = "UNVERIFIED"

            obs.ml_event_type = ml_event_type
            obs.ml_confidence = ml_confidence
            obs.trust_score = trust_score
            obs.verification_recommendation = verification_rec
            obs.model_version = model_version
            obs.ml_processed_at = ml_processed_at

            db.commit()
            db.refresh(obs)
            success = True

            item_to_push = {
                "event_id": obs.source_event_id,
                "source": obs.source,
                "city": obs.city or "Unknown",
                "state": obs.state or "Unknown",
                "event_type": obs.event_type or "OTHER",
                "content": obs.content,
                "ml_event_type": obs.ml_event_type,
                "ml_confidence": obs.ml_confidence,
                "trust_score": obs.trust_score,
                "verification_recommendation": obs.verification_recommendation,
                "resolved_city": obs.resolved_city,
                "resolved_state": obs.resolved_state,
                "location_confidence": obs.location_confidence,
                "is_duplicate": obs.is_duplicate,
                "duplicate_group_id": obs.duplicate_group_id,
                "duplicate_similarity": obs.duplicate_similarity,
                "duplicate_of_id": obs.duplicate_of_id
            }

        except IntegrityError:
            db.rollback()
            # This means it's a duplicate. We consider processing successful because we don't want to insert it again.
            logger.info(f"Duplicate event {data.get('source_event_id')} from {data.get('source')}. Ignoring.")
            success = True
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to process message {data.get('event_id')} to DB: {e}")
            success = False
        finally:
            db.close()

        if success:
            # Commit offset manually ONLY after DB success
            tp = TopicPartition(topic, partition)
            try:
                await self.consumer.commit({tp: offset + 1})
                logger.debug(f"Committed offset {offset + 1} for partition {partition}")
            except Exception as e:
                logger.error(f"Failed to commit offset: {e}")
            
            if item_to_push:
                try:
                    await push_to_clients(item_to_push)
                except Exception as e:
                    logger.error(f"Failed to push SSE to clients: {e}")
        else:
            # We don't commit the offset, meaning on restart the message will be reprocessed.
            logger.warning(f"Offset {offset} not committed due to processing failure.")


consumer_service = KafkaConsumerService()
