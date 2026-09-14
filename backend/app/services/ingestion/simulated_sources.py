"""
Simulated ingestion adapters for source categories without live integrations.
Each adapter produces structurally distinct records matching the real-world
data that source would genuinely emit.

All simulated records are marked is_mock=True.
"""
import logging
import random
import uuid
from datetime import datetime, timedelta, timezone
from app.services.ingestion.base import BaseIngestionAdapter

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))

# Shared geography pool — Indian cities with realistic coords
LOCATIONS = [
    {"city": "Chennai",    "district": "Chennai",          "state": "Tamil Nadu",   "lat": 13.0827, "lon": 80.2707},
    {"city": "Bengaluru",  "district": "Bengaluru Urban",  "state": "Karnataka",    "lat": 12.9716, "lon": 77.5946},
    {"city": "Mumbai",     "district": "Mumbai Suburban",   "state": "Maharashtra",  "lat": 19.0760, "lon": 72.8777},
    {"city": "Delhi",      "district": "Central Delhi",     "state": "Delhi",        "lat": 28.7041, "lon": 77.1025},
    {"city": "Kolkata",    "district": "Kolkata",           "state": "West Bengal",  "lat": 22.5726, "lon": 88.3639},
    {"city": "Hyderabad",  "district": "Hyderabad",         "state": "Telangana",    "lat": 17.3850, "lon": 78.4867},
    {"city": "Pune",       "district": "Pune",              "state": "Maharashtra",  "lat": 18.5204, "lon": 73.8567},
    {"city": "Jaipur",     "district": "Jaipur",            "state": "Rajasthan",    "lat": 26.9124, "lon": 75.7873},
    {"city": "Ahmedabad",  "district": "Ahmedabad",         "state": "Gujarat",      "lat": 23.0225, "lon": 72.5714},
    {"city": "Lucknow",    "district": "Lucknow",           "state": "Uttar Pradesh","lat": 26.8467, "lon": 80.9462},
    {"city": "Bhubaneswar","district": "Khordha",           "state": "Odisha",       "lat": 20.2961, "lon": 85.8245},
    {"city": "Kochi",      "district": "Ernakulam",         "state": "Kerala",       "lat": 9.9312,  "lon": 76.2673},
]

def _pick_location():
    loc = random.choice(LOCATIONS)
    return {
        "city": loc["city"],
        "district": loc["district"],
        "state": loc["state"],
        "latitude": loc["lat"] + random.uniform(-0.03, 0.03),
        "longitude": loc["lon"] + random.uniform(-0.03, 0.03),
    }


# ─── CITIZEN REPORTS ───────────────────────────────────────────────────────────

class CitizenReportAdapter(BaseIngestionAdapter):
    """Simulated citizen mobile app reports — varied first-person weather observations."""

    REPORTS = [
        {"content": "Water level rising rapidly near {city} main road junction. My car is stuck in 2 feet of water near the bus stop. Rain hasn't stopped for 3 hours.", "event_type": "Urban Flooding", "severity": 4},
        {"content": "Extremely heavy downpour in {district} area since morning. Visibility less than 50 meters. Schools should be closed today.", "event_type": "Rainfall", "severity": 3},
        {"content": "Strong gusty winds uprooted a large neem tree near {city} railway station. Power lines are down on MG Road. Please send help.", "event_type": "Thunderstorm", "severity": 4},
        {"content": "Unbearable heat in {city} today. My outdoor thermometer shows 46°C. Several street vendors have collapsed near the market area.", "event_type": "Heatwave", "severity": 4},
        {"content": "Very thick fog on {city}-{district} highway this morning. Almost zero visibility. Two minor accidents already reported near toll plaza.", "event_type": "Dense Fog", "severity": 3},
        {"content": "Slight drizzle in {city} {district} area. Roads are wet but traffic is moving normally. Pleasant weather overall.", "event_type": "Rainfall", "severity": 1},
        {"content": "Waterlogging in {district} underpass after sudden cloudburst. Autos and bikes unable to pass. Water still rising.", "event_type": "Urban Flooding", "severity": 3},
        {"content": "Lightning strikes very frequent over {city} suburbs. Lost power 20 minutes ago. Children are scared. When will it stop?", "event_type": "Thunderstorm", "severity": 3},
    ]

    async def fetch(self) -> list[dict]:
        results = []
        for _ in range(random.randint(1, 2)):
            loc = _pick_location()
            template = random.choice(self.REPORTS)
            content = template["content"].format(city=loc["city"], district=loc["district"])
            results.append({
                "source": "Citizen Mobile App",
                "source_type": "citizen",
                "source_event_id": f"cit-{uuid.uuid4().hex[:10]}",
                "observed_at": datetime.utcnow() - timedelta(minutes=random.randint(2, 25)),
                "content": content,
                "event_type": template["event_type"],
                "severity": template["severity"],
                "trust_score": round(random.uniform(45, 78), 1),
                "verification_status": random.choice(["UNVERIFIED", "UNDER_REVIEW"]),
                "model_version": None,  # Awaiting analysis
                "is_mock": True,
                **loc,
            })
        return results

    def normalize(self, raw_data: dict) -> dict:
        return raw_data


# ─── IMD OFFICIAL FEED ─────────────────────────────────────────────────────────

class IMDAdapter(BaseIngestionAdapter):
    """Simulated IMD bulletins — official meteorological warnings and observations."""

    BULLETINS = [
        {"content": "IMD Bulletin #{bulletin_id}: Heavy to very heavy rainfall (115.6-204.4 mm) very likely at isolated places over {district}, {state}. Valid: next 24 hours. Fishermen advised not to venture into sea.", "event_type": "Rainfall", "severity": 4},
        {"content": "IMD Warning #{bulletin_id}: Thunderstorm accompanied with lightning, gusty winds (50-60 kmph) and hail very likely over {city} and adjoining districts during next 3-4 hours.", "event_type": "Thunderstorm", "severity": 4},
        {"content": "IMD Heatwave Alert #{bulletin_id}: Heatwave to severe heatwave conditions very likely over {state} during next 3 days. Maximum temperature departure: +4-6°C above normal. {city} district on RED alert.", "event_type": "Heatwave", "severity": 5},
        {"content": "IMD Cyclone Advisory #{bulletin_id}: Deep depression over Bay of Bengal (lat {lat:.1f}°N, lon {lon:.1f}°E) likely to intensify into cyclonic storm. {state} coast on HIGH alert. NDRF teams pre-positioned.", "event_type": "Cyclone", "severity": 5},
        {"content": "IMD Observation #{bulletin_id}: Moderate rainfall (15.6-64.4 mm) recorded over {city} in past 24 hours. Relative humidity 82%. Winds NW 15 kmph. Conditions favourable for further rainfall.", "event_type": "Rainfall", "severity": 2},
        {"content": "IMD Dense Fog Warning #{bulletin_id}: Very dense fog (visibility <50m) very likely over {state} during early morning hours. Commuters advised to exercise caution. Valid: next 48 hours.", "event_type": "Dense Fog", "severity": 3},
    ]

    async def fetch(self) -> list[dict]:
        results = []
        for _ in range(random.randint(1, 2)):
            loc = _pick_location()
            template = random.choice(self.BULLETINS)
            bulletin_id = f"IMD-{random.randint(2024, 2026)}-{random.randint(1000, 9999)}"
            content = template["content"].format(
                bulletin_id=bulletin_id,
                city=loc["city"], district=loc["district"], state=loc["state"],
                lat=loc["latitude"], lon=loc["longitude"],
            )
            results.append({
                "source": "IMD Official",
                "source_type": "imd",
                "source_url": "https://mausam.imd.gov.in/",
                "source_event_id": f"imd-{uuid.uuid4().hex[:10]}",
                "observed_at": datetime.utcnow() - timedelta(minutes=random.randint(5, 45)),
                "content": content,
                "event_type": template["event_type"],
                "severity": template["severity"],
                "trust_score": round(random.uniform(88, 97), 1),
                "verification_status": "VERIFIED",
                "model_version": "official_bulletin",
                "is_mock": True,
                **loc,
            })
        return results

    def normalize(self, raw_data: dict) -> dict:
        return raw_data


# ─── SOCIAL MEDIA ──────────────────────────────────────────────────────────────
# NOTE: The existing IMDSocialMediaAdapter in social_media.py handles this category.
# This adapter is kept as an additional social variant for diversity.

class SocialMediaAdapter(BaseIngestionAdapter):
    """Simulated weather-related social media posts with hashtags and platform metadata."""

    POSTS = [
        {"content": "Massive waterlogging near {city} station! Trains delayed. Stay home if you can 🌧️ #{city}Rains #FloodAlert #WeatherUpdate", "event_type": "Urban Flooding", "severity": 3},
        {"content": "This heat is killing me 🥵 {city} feels like an oven today. 45+ degrees easy. #Heatwave #{state} #StayHydrated", "event_type": "Heatwave", "severity": 3},
        {"content": "Incredible thunderstorm over {city} right now ⛈️ Lightning every 10 seconds. Power out in {district}. #{city}Weather #IMD", "event_type": "Thunderstorm", "severity": 3},
        {"content": "Just saw @IMDWeather forecast for {city} - heavy rain expected next 48hrs. Stock up essentials! #MonsoonAlert #{state}Monsoon", "event_type": "Rainfall", "severity": 2},
        {"content": "Roads completely submerged in {district}, {city}. Rescue boats deployed. This is getting serious. #{city}Floods #NDRF #Rescue", "event_type": "Urban Flooding", "severity": 4},
        {"content": "Beautiful rainbow after the storm in {city} 🌈 But roads are still waterlogged in low-lying areas. #AfterTheStorm #{city}", "event_type": "Rainfall", "severity": 1},
    ]

    async def fetch(self) -> list[dict]:
        results = []
        platforms = ["Twitter/X", "Instagram", "Facebook"]
        for _ in range(random.randint(1, 2)):
            loc = _pick_location()
            template = random.choice(self.POSTS)
            content = template["content"].format(city=loc["city"], district=loc["district"], state=loc["state"])
            platform = random.choice(platforms)
            results.append({
                "source": f"Social Media ({platform})",
                "source_type": "social_media",
                "source_url": f"https://{platform.lower().replace('/', '').replace(' ', '')}.com/post/{uuid.uuid4().hex[:8]}",
                "source_event_id": f"soc-{uuid.uuid4().hex[:10]}",
                "observed_at": datetime.utcnow() - timedelta(minutes=random.randint(3, 40)),
                "content": content,
                "event_type": template["event_type"],
                "severity": template["severity"],
                "trust_score": round(random.uniform(25, 62), 1),
                "verification_status": random.choice(["UNVERIFIED", "UNDER_REVIEW"]),
                "model_version": None,
                "is_mock": True,
                **loc,
            })
        return results

    def normalize(self, raw_data: dict) -> dict:
        return raw_data


# ─── PUBLIC DATASETS ───────────────────────────────────────────────────────────

class PublicDatasetAdapter(BaseIngestionAdapter):
    """Simulated structured IoT sensor / government dataset records."""

    async def fetch(self) -> list[dict]:
        results = []
        for _ in range(random.randint(1, 2)):
            loc = _pick_location()
            station_id = f"AWS-{loc['state'][:2].upper()}-{random.randint(100, 999)}"
            temp = round(random.uniform(22, 42), 1)
            humidity = random.randint(40, 95)
            rainfall_mm = round(random.uniform(0, 85), 1)
            wind_kmph = round(random.uniform(5, 65), 1)
            pressure_hpa = round(random.uniform(995, 1018), 1)

            content = (
                f"Station {station_id} ({loc['city']}): "
                f"Temp {temp}°C, RH {humidity}%, "
                f"Rainfall {rainfall_mm}mm/hr, "
                f"Wind {wind_kmph} km/h, "
                f"Pressure {pressure_hpa} hPa. "
                f"Data source: data.gov.in automated weather station network."
            )

            sev = 1
            if rainfall_mm > 60: sev = 4
            elif rainfall_mm > 30: sev = 3
            elif rainfall_mm > 10: sev = 2

            evt = "OTHER"
            if rainfall_mm > 15: evt = "Rainfall"
            if temp >= 42: evt = "Heatwave"
            if wind_kmph > 50: evt = "Thunderstorm"

            results.append({
                "source": "Govt AWS Network",
                "source_type": "public_dataset",
                "source_url": "https://data.gov.in/",
                "source_event_id": f"aws-{uuid.uuid4().hex[:10]}",
                "observed_at": datetime.utcnow() - timedelta(minutes=random.randint(1, 15)),
                "content": content,
                "event_type": evt,
                "severity": sev,
                "trust_score": round(random.uniform(82, 95), 1),
                "verification_status": "VERIFIED",
                "model_version": "telemetry",
                "is_mock": True,
                **loc,
            })
        return results

    def normalize(self, raw_data: dict) -> dict:
        return raw_data


# ─── WEBSITES / NEWS ──────────────────────────────────────────────────────────

class NewsWebAdapter(BaseIngestionAdapter):
    """Simulated weather news article extractions."""

    ARTICLES = [
        {"content": "[{publisher}] \"{city} Braces for Heavy Monsoon Spell\" — IMD has issued a red alert for {district} district as {state} prepares for another round of intense rainfall. Municipal authorities have opened 12 relief shelters.", "event_type": "Rainfall", "severity": 3},
        {"content": "[{publisher}] \"Flash Floods Disrupt Life in {city}\" — Sudden heavy downpour caused severe waterlogging across multiple arterial roads in {city}. Railway services on {district} suburban corridor have been suspended.", "event_type": "Urban Flooding", "severity": 4},
        {"content": "[{publisher}] \"Heat Wave Grips {state}; {city} Records {temp}°C\" — Temperatures soared across northern {state} with {city} recording {temp}°C, 5 degrees above normal. Health advisory issued for outdoor workers.", "event_type": "Heatwave", "severity": 4},
        {"content": "[{publisher}] \"Cyclone Watch: Depression Over Bay May Intensify\" — A low-pressure system near {state} coast is being monitored. {city} port has been put on alert. Fishing boats recalled to shore.", "event_type": "Cyclone", "severity": 3},
        {"content": "[{publisher}] \"Dense Fog Blankets {state}, Flights Diverted\" — {city} airport reported near-zero visibility for 4 hours this morning. 15 flights diverted, 30+ delayed. Rail services running 2-3 hours late.", "event_type": "Dense Fog", "severity": 3},
    ]

    PUBLISHERS = ["NDTV", "The Hindu", "Times of India", "India Today", "Hindustan Times", "The Indian Express"]

    async def fetch(self) -> list[dict]:
        results = []
        for _ in range(random.randint(1, 2)):
            loc = _pick_location()
            template = random.choice(self.ARTICLES)
            publisher = random.choice(self.PUBLISHERS)
            content = template["content"].format(
                publisher=publisher,
                city=loc["city"], district=loc["district"], state=loc["state"],
                temp=random.randint(43, 47),
            )
            results.append({
                "source": f"News ({publisher})",
                "source_type": "web",
                "source_url": f"https://{publisher.lower().replace(' ', '')}.com/weather/{uuid.uuid4().hex[:6]}",
                "source_event_id": f"news-{uuid.uuid4().hex[:10]}",
                "observed_at": datetime.utcnow() - timedelta(minutes=random.randint(15, 90)),
                "content": content,
                "event_type": template["event_type"],
                "severity": template["severity"],
                "trust_score": round(random.uniform(65, 82), 1),
                "verification_status": random.choice(["VERIFIED", "UNDER_REVIEW"]),
                "model_version": None,
                "is_mock": True,
                **loc,
            })
        return results

    def normalize(self, raw_data: dict) -> dict:
        return raw_data


# ─── SATELLITE / RADAR ─────────────────────────────────────────────────────────

class SatelliteRadarAdapter(BaseIngestionAdapter):
    """Simulated Doppler radar and satellite remote-sensing observations."""

    async def fetch(self) -> list[dict]:
        results = []
        for _ in range(random.randint(1, 2)):
            loc = _pick_location()
            observation_type = random.choice(["DWR", "INSAT-3D", "INSAT-3DR"])

            if observation_type == "DWR":
                reflectivity = random.randint(25, 62)
                max_echo = random.randint(35, 65)
                content = (
                    f"DWR {loc['city']}: Max reflectivity {reflectivity} dBZ at {random.randint(2, 8)} km range. "
                    f"Echo top {max_echo} dBZ. Storm cell moving {random.choice(['NE', 'NW', 'SE', 'SW'])} at "
                    f"{random.randint(15, 45)} km/h. {'Heavy precipitation core detected.' if reflectivity > 45 else 'Moderate precipitation echo.'}"
                )
                sev = 4 if reflectivity > 50 else (3 if reflectivity > 35 else 2)
                evt = "Thunderstorm" if reflectivity > 45 else "Rainfall"
            else:
                cloud_top_temp = round(random.uniform(-65, -20), 1)
                coverage_pct = random.randint(40, 95)
                content = (
                    f"{observation_type} IR imagery: Cloud-top temperature {cloud_top_temp}°C over {loc['city']}, {loc['state']}. "
                    f"Convective cloud coverage {coverage_pct}% in 50km radius. "
                    f"{'Deep convection signatures detected — heavy rainfall likely.' if cloud_top_temp < -50 else 'Moderate convective activity observed.'}"
                )
                sev = 4 if cloud_top_temp < -55 else (3 if cloud_top_temp < -40 else 2)
                evt = "Thunderstorm" if cloud_top_temp < -50 else "Rainfall"

            results.append({
                "source": f"{observation_type} Observation",
                "source_type": "satellite",
                "source_url": None,
                "source_event_id": f"sat-{uuid.uuid4().hex[:10]}",
                "observed_at": datetime.utcnow() - timedelta(minutes=random.randint(1, 20)),
                "content": content,
                "event_type": evt,
                "severity": sev,
                "trust_score": round(random.uniform(85, 96), 1),
                "verification_status": "VERIFIED",
                "model_version": "remote_sensing",
                "is_mock": True,
                **loc,
            })
        return results

    def normalize(self, raw_data: dict) -> dict:
        return raw_data
