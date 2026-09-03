import logging
import math
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class DuplicateResult:
    def __init__(self, is_duplicate: bool, duplicate_of_id: str = None, 
                 similarity: float = 0.0, reason: str = None, group_id: str = None):
        self.is_duplicate = is_duplicate
        self.duplicate_of_id = duplicate_of_id
        self.similarity = similarity
        self.reason = reason
        self.group_id = group_id

class DuplicateDetectorService:
    def __init__(self):
        self.has_ml = False
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            self.TfidfVectorizer = TfidfVectorizer
            self.cosine_similarity = cosine_similarity
            self.has_ml = True
            logger.info("Initialized ML components for duplicate detection.")
        except ImportError:
            logger.warning("scikit-learn not installed. Duplicate detection will use exact string matching only.")
            
        # Thresholds
        self.SIMILARITY_THRESHOLD = 0.75
        self.TIME_WINDOW_HOURS = 2
        self.DISTANCE_THRESHOLD_KM = 50.0

    def _haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat/2) * math.sin(dLat/2) + \
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
            math.sin(dLon/2) * math.sin(dLon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    def detect_duplicate(self, new_report: Dict[str, Any], candidates: List[Any]) -> DuplicateResult:
        if not candidates:
            return DuplicateResult(is_duplicate=False)
            
        new_text = new_report.get("content", "").lower().strip()
        if not new_text:
            return DuplicateResult(is_duplicate=False)
            
        new_lat = new_report.get("latitude")
        new_lon = new_report.get("longitude")
        new_event_type = new_report.get("event_type", "OTHER")
        
        # 1. Filter candidates by time (already done by query, but double check), event type, and location
        valid_candidates = []
        for c in candidates:
            # Event type must be compatible or one of them is OTHER
            if c.event_type != "OTHER" and new_event_type != "OTHER" and c.event_type != new_event_type:
                continue
                
            # Geographic proximity
            if new_lat and new_lon and c.latitude and c.longitude:
                dist = self._haversine(new_lat, new_lon, c.latitude, c.longitude)
                if dist > self.DISTANCE_THRESHOLD_KM:
                    continue
            elif new_report.get("resolved_city") and c.resolved_city:
                # If we don't have coords but we have resolved cities, they must match
                if new_report.get("resolved_city") != c.resolved_city:
                    continue
                    
            valid_candidates.append(c)
            
        if not valid_candidates:
            return DuplicateResult(is_duplicate=False)
            
        if not self.has_ml:
            # Fallback exact matching
            for c in valid_candidates:
                if (c.content or "").lower().strip() == new_text:
                    return DuplicateResult(
                        is_duplicate=True,
                        duplicate_of_id=c.id,
                        similarity=1.0,
                        reason="Exact string match (fallback)",
                        group_id=c.duplicate_group_id or f"GRP-{c.id}"
                    )
            return DuplicateResult(is_duplicate=False)
            
        # 2. Text Similarity using TF-IDF
        corpus = [new_text] + [(c.content or "").lower().strip() for c in valid_candidates]
        try:
            vectorizer = self.TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(corpus)
            cosine_sims = self.cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            
            best_idx = int(cosine_sims.argmax())
            best_score = float(cosine_sims[best_idx])
            
            if best_score >= self.SIMILARITY_THRESHOLD:
                best_candidate = valid_candidates[best_idx]
                group_id = best_candidate.duplicate_group_id or f"GRP-{best_candidate.id}"
                
                reason = f"High text similarity ({best_score*100:.1f}%) + close location/time"
                return DuplicateResult(
                    is_duplicate=True,
                    duplicate_of_id=best_candidate.id,
                    similarity=best_score,
                    reason=reason,
                    group_id=group_id
                )
        except Exception as e:
            logger.error(f"TF-IDF duplicate detection failed: {e}")
            
        return DuplicateResult(is_duplicate=False)

duplicate_detector = DuplicateDetectorService()
