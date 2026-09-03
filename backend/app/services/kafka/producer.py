import asyncio
import json
import logging
from aiokafka import AIOKafkaProducer
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

class KafkaProducerService:
    def __init__(self):
        self.bootstrap_servers = settings.KAFKA_BOOTSTRAP_SERVERS
        self.producer: Optional[AIOKafkaProducer] = None
        self.connected = False

    async def start(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        try:
            await self.producer.start()
            self.connected = True
            logger.info("Successfully connected to Kafka Producer.")
        except Exception as e:
            self.connected = False
            logger.error(f"Failed to connect to Kafka Producer: {e}")
            # We don't raise here; we allow the app to run without Kafka
            # but we log the failure.

    async def stop(self):
        if self.producer and self.connected:
            await self.producer.stop()
            self.connected = False
            logger.info("Kafka Producer stopped.")

    async def publish(self, topic: str, message: BaseModel) -> bool:
        if not self.connected or not self.producer:
            logger.debug(f"Cannot publish to {topic}: Kafka Producer is not connected.")
            return False

        try:
            # We use message.model_dump() for Pydantic v2 or dict() for v1. 
            # We will use model_dump() with mode='json' to handle datetimes.
            data = message.model_dump(mode='json')
            await self.producer.send_and_wait(topic, data)
            logger.info(f"Successfully published message {data.get('event_id')} to topic {topic}.")
            return True
        except Exception as e:
            logger.error(f"Failed to publish message to topic {topic}: {e}")
            return False

producer_service = KafkaProducerService()
