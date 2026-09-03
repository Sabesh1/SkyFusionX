import json
import os
import logging
from typing import Optional, Dict, Any, Tuple
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class LocationResult(BaseModel):
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: float = 0.0
    method: str = "UNKNOWN"

class IndiaLocationResolver:
    def __init__(self, dataset_path: str = None):
        self.cities = []
        self.state_map = {}
        
        if not dataset_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            dataset_path = os.path.join(base_dir, "ml", "datasets", "cities.json")
            
        try:
            if os.path.exists(dataset_path):
                with open(dataset_path, 'r', encoding='utf-8') as f:
                    self.cities = json.load(f)
                
                # Build state mappings for quick lookup
                for city in self.cities:
                    state = city.get("state")
                    if state:
                        self.state_map[state.lower()] = state
                        
                logger.info(f"Loaded {len(self.cities)} Indian cities for location resolution.")
            else:
                logger.warning(f"Location dataset not found at {dataset_path}")
        except Exception as e:
            logger.error(f"Failed to load location dataset: {e}")
            
        # We only import rapidfuzz if available, so it doesn't break if missing
        try:
            from rapidfuzz import process, fuzz
            self.has_fuzz = True
            self.fuzz = fuzz
            self.process = process
        except ImportError:
            self.has_fuzz = False
            logger.warning("rapidfuzz not installed. Fuzzy matching will be disabled.")
            
    def _normalize(self, text: str) -> str:
        if not text:
            return ""
        return text.lower().strip()

    def resolve(self, explicit_city: str = None, explicit_state: str = None, 
                lat: float = None, lon: float = None, text: str = None) -> LocationResult:
        
        # 1. Explicit Coordinates (High confidence)
        if lat is not None and lon is not None:
            # We trust coordinates. Let's see if we can find the closest city to enrich it.
            closest_city = self._get_closest_city(lat, lon)
            
            result = LocationResult(
                latitude=lat,
                longitude=lon,
                confidence=1.0,
                method="EXPLICIT_COORDINATES"
            )
            
            if closest_city:
                result.city = closest_city.get("name")
                result.state = closest_city.get("state")
            elif explicit_city or explicit_state:
                result.city = explicit_city
                result.state = explicit_state
                
            return result
            
        # 2. Explicit City + State (High confidence)
        if explicit_city and explicit_state:
            match = self._find_exact_city(explicit_city, explicit_state)
            if match:
                return LocationResult(
                    city=match.get("name"),
                    state=match.get("state"),
                    latitude=float(match.get("lat")) if match.get("lat") else None,
                    longitude=float(match.get("lng")) if match.get("lng") else None,
                    confidence=0.95,
                    method="STRUCTURED_LOCATION"
                )
                
        # 3. Explicit City only
        if explicit_city:
            match = self._find_exact_city(explicit_city, None)
            if match:
                return LocationResult(
                    city=match.get("name"),
                    state=match.get("state"),
                    latitude=float(match.get("lat")) if match.get("lat") else None,
                    longitude=float(match.get("lng")) if match.get("lng") else None,
                    confidence=0.90,
                    method="STRUCTURED_LOCATION"
                )
                
        # 4. Free-text gazetteer matching
        if text and self.has_fuzz and self.cities:
            norm_text = self._normalize(text)
            candidates = []
            
            # Sort cities by length descending to match longest names first
            sorted_cities = sorted(self.cities, key=lambda c: len(c.get("name", "")), reverse=True)
            
            for city in sorted_cities:
                c_name = self._normalize(city.get("name", ""))
                if c_name and len(c_name) > 3 and c_name in norm_text:
                    candidates.append((city, 1.0))
                    break # take the first longest match
                    
            if candidates:
                best_city = candidates[0][0]
                return LocationResult(
                    city=best_city.get("name"),
                    state=best_city.get("state"),
                    latitude=float(best_city.get("lat")) if best_city.get("lat") else None,
                    longitude=float(best_city.get("lng")) if best_city.get("lng") else None,
                    confidence=0.85,
                    method="GAZETTEER"
                )
                
            # Fuzzy matching
            words = [w for w in norm_text.replace(',', ' ').split() if len(w) > 3]
            best_match = None
            best_score = 0
            city_names = {self._normalize(c.get("name", "")): c for c in self.cities if c.get("name")}
            
            for word in words:
                res = self.process.extractOne(word, city_names.keys(), scorer=self.fuzz.WRatio)
                if res:
                    match_str, score, _ = res
                    if score > best_score and score > 85: # threshold
                        best_score = score
                        best_match = city_names[match_str]
                        
            if best_match:
                return LocationResult(
                    city=best_match.get("name"),
                    state=best_match.get("state"),
                    latitude=float(best_match.get("lat")) if best_match.get("lat") else None,
                    longitude=float(best_match.get("lng")) if best_match.get("lng") else None,
                    confidence=best_score / 100.0,
                    method="FUZZY_GAZETTEER"
                )
                
            # 5. Check if state is mentioned
            for state_norm, state_real in self.state_map.items():
                if state_norm in norm_text:
                    return LocationResult(
                        state=state_real,
                        confidence=0.80,
                        method="GAZETTEER"
                    )

        return LocationResult()
        
    def _find_exact_city(self, city_name: str, state_name: str = None) -> Optional[Dict]:
        norm_city = self._normalize(city_name)
        norm_state = self._normalize(state_name) if state_name else None
        
        matches = []
        for city in self.cities:
            if self._normalize(city.get("name", "")) == norm_city:
                if norm_state:
                    if self._normalize(city.get("state", "")) == norm_state:
                        return city
                else:
                    matches.append(city)
                    
        if matches:
            return matches[0]
        return None
        
    def _get_closest_city(self, lat: float, lon: float) -> Optional[Dict]:
        if not self.cities:
            return None
        import math
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371
            dLat = math.radians(lat2 - lat1)
            dLon = math.radians(lon2 - lon1)
            a = math.sin(dLat/2) * math.sin(dLat/2) + \
                math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
                math.sin(dLon/2) * math.sin(dLon/2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            return R * c
            
        closest = None
        min_dist = float('inf')
        
        for city in self.cities:
            c_lat = city.get("lat")
            c_lng = city.get("lng")
            if c_lat and c_lng:
                dist = haversine(lat, lon, float(c_lat), float(c_lng))
                if dist < min_dist:
                    min_dist = dist
                    closest = city
                    
        if min_dist <= 50:
            return closest
        return None

location_resolver = IndiaLocationResolver()
