import asyncio
import json
import logging
from typing import Dict, Any, Callable
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from app.core.config import settings
from stream.topics import ALL_TOPICS

logger = logging.getLogger(__name__)

class StreamClient:
    """
    Lightweight stream client supporting Kafka/Redpanda.
    Falls back to asyncio.Queue for local testing if Kafka is unavailable.
    """
    def __init__(self):
        self.bootstrap_servers = settings.KAFKA_BOOTSTRAP_SERVERS
        self.producer = None
        self.consumers = {}
        self.use_mock = False
        self.mock_queues = {topic: asyncio.Queue() for topic in ALL_TOPICS}
        
    async def connect(self):
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            await self.producer.start()
            logger.info("Connected to Redpanda/Kafka producer.")
        except Exception as e:
            logger.warning(f"Failed to connect to Kafka, falling back to mock queue. Error: {e}")
            self.use_mock = True

    async def disconnect(self):
        if self.producer and not self.use_mock:
            await self.producer.stop()
        for consumer in self.consumers.values():
            if not self.use_mock:
                await consumer.stop()

    async def send(self, topic: str, message: Dict[str, Any]):
        if self.use_mock:
            await self.mock_queues[topic].put(message)
        else:
            try:
                await self.producer.send_and_wait(topic, message)
            except Exception as e:
                logger.error(f"Error sending to Kafka topic {topic}: {e}")
                # Fallback on failure
                await self.mock_queues[topic].put(message)

    async def consume(self, topic: str, callback: Callable):
        if self.use_mock:
            while True:
                message = await self.mock_queues[topic].get()
                try:
                    await callback(message)
                except Exception as e:
                    logger.error(f"Error processing mock message from {topic}: {e}")
                finally:
                    self.mock_queues[topic].task_done()
        else:
            try:
                consumer = AIOKafkaConsumer(
                    topic,
                    bootstrap_servers=self.bootstrap_servers,
                    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                    group_id=f"weather_group_{topic}",
                    auto_offset_reset='latest'
                )
                await consumer.start()
                self.consumers[topic] = consumer
                
                async for msg in consumer:
                    try:
                        await callback(msg.value)
                    except Exception as e:
                        logger.error(f"Error processing message from {topic}: {e}")
            except Exception as e:
                logger.error(f"Error consuming from Kafka {topic}: {e}")

stream_client = StreamClient()
