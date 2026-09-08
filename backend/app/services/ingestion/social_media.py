import logging
import asyncio
import random
import uuid
from datetime import datetime, timedelta
from app.services.ingestion.base import BaseIngestionAdapter

logger = logging.getLogger(__name__)

class IMDSocialMediaAdapter(BaseIngestionAdapter):
    """
    Simulated ingestion adapter for #IMD Twitter/Social Media posts.
    Since we don't have access to the X/Twitter API, this mocks the feed
    of incoming social media posts tagged with #IMD to demonstrate compliance
    with the SIH problem statement.
    """
    
    def __init__(self):
        super().__init__()
        self.cities = ["Chennai", "Bengaluru", "Mumbai", "Delhi", "Kolkata", "Hyderabad", "Pune"]
        self.states = {"Chennai": "Tamil Nadu", "Bengaluru": "Karnataka", "Mumbai": "Maharashtra", 
                       "Delhi": "Delhi", "Kolkata": "West Bengal", "Hyderabad": "Telangana", "Pune": "Maharashtra"}
        self.lat_lons = {
            "Chennai": (13.0827, 80.2707),
            "Bengaluru": (12.9716, 77.5946),
            "Mumbai": (19.0760, 72.8777),
            "Delhi": (28.7041, 77.1025),
            "Kolkata": (22.5726, 88.3639),
            "Hyderabad": (17.3850, 78.4867),
            "Pune": (18.5204, 73.8567)
        }
        self.templates = [
            "Heavy rainfall expected in {city} next 2 hours. Stay safe! #IMD #WeatherAlert",
            "Water logging reported in parts of {city}. Avoid traveling. @IMDWeather #{city}Rains #IMD",
            "Current temperature in {city} is extremely high. Heatwave warning active. #IMD",
            "Thunderstorm clouds gathering over {city} bypass. #IMDUpdate #IMD",
            "Massive dust storm heading towards {city} outskirts. Reduced visibility! #IMD"
        ]

    async def fetch(self) -> list[dict]:
        """Generate 1-2 random social media posts representing newly ingested data."""
        results = []
        num_posts = random.randint(1, 2)
        
        for _ in range(num_posts):
            city = random.choice(self.cities)
            template = random.choice(self.templates)
            content = template.format(city=city)
            
            lat, lon = self.lat_lons[city]
            # Add some jitter to coords
            lat += random.uniform(-0.05, 0.05)
            lon += random.uniform(-0.05, 0.05)
            
            event_id = f"tw-{uuid.uuid4().hex[:10]}"
            
            item = {
                "source": "Twitter #IMD",
                "source_type": "social_media",
                "source_url": "https://twitter.com/search?q=%23IMD",
                "source_event_id": event_id,
                "observed_at": datetime.utcnow() - timedelta(minutes=random.randint(1, 15)),
                "city": city,
                "state": self.states[city],
                "latitude": lat,
                "longitude": lon,
                "event_type": "OTHER",
                "content": content,
                "severity": random.randint(1, 3),
                "is_mock": True
            }
            results.append(item)
            
        logger.info(f"Fetched {len(results)} simulated #IMD social media posts.")
        return results

    def normalize(self, raw_data: dict) -> dict:
        """The fetch method already returns a normalized dict."""
        return raw_data
