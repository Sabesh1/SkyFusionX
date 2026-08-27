import numpy as np
import hdbscan
from datetime import datetime
from typing import List, Dict, Any

class ClusteringEngine:
    """
    Groups individual observations into unified Weather Events using density-based clustering.
    Prototype uses HDBSCAN.
    """
    
    # Earth radius in km
    EARTH_RADIUS = 6371.0

    @staticmethod
    def haversine_distance(lat1, lon1, lat2, lon2):
        """Calculate the great circle distance in kilometers between two points on the earth."""
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2.0)**2
        c = 2 * np.arcsin(np.sqrt(a))
        return c * ClusteringEngine.EARTH_RADIUS

    @classmethod
    def compute_distance_matrix(cls, observations: List[Dict[str, Any]]) -> np.ndarray:
        """
        Computes a custom distance matrix combining spatial (km) and temporal differences.
        For the prototype, we equate 30 minutes to 10km of spatial distance to allow joint clustering.
        """
        n = len(observations)
        dist_matrix = np.zeros((n, n))
        
        # 30 minutes = 1800 seconds. We want 1800s to equal 10km in the distance matrix.
        # So, 1 second = 10 / 1800 km = 1/180 km
        time_weight = 10.0 / 1800.0

        for i in range(n):
            for j in range(i + 1, n):
                obs1 = observations[i]
                obs2 = observations[j]
                
                # Spatial distance
                spatial_dist = cls.haversine_distance(
                    obs1.get('latitude', 0.0), obs1.get('longitude', 0.0),
                    obs2.get('latitude', 0.0), obs2.get('longitude', 0.0)
                )
                
                # Temporal distance (seconds)
                t1 = obs1.get('observed_at', datetime.utcnow())
                t2 = obs2.get('observed_at', datetime.utcnow())
                if isinstance(t1, str):
                    t1 = datetime.fromisoformat(t1.replace("Z", "+00:00"))
                if isinstance(t2, str):
                    t2 = datetime.fromisoformat(t2.replace("Z", "+00:00"))
                
                time_diff_sec = abs((t1 - t2).total_seconds())
                temporal_dist = time_diff_sec * time_weight
                
                # Categorical distance (event_type)
                type1 = obs1.get('event_type', 'OTHER')
                type2 = obs2.get('event_type', 'OTHER')
                type_dist = 0.0 if type1 == type2 else 50.0 # 50km penalty for different types
                
                # Total composite distance
                total_dist = spatial_dist + temporal_dist + type_dist
                
                dist_matrix[i, j] = total_dist
                dist_matrix[j, i] = total_dist
                
        return dist_matrix

    @classmethod
    def cluster(cls, observations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Clusters a list of observations into events.
        """
        if not observations:
            return []
            
        if len(observations) < 3:
            # Not enough for HDBSCAN min_cluster_size=3. Treat as noise or form micro-clusters manually if needed.
            # For this prototype, if it's less than 3, we don't form an HDBSCAN cluster. 
            # We return them as unclustered (-1).
            labels = [-1] * len(observations)
        else:
            dist_matrix = cls.compute_distance_matrix(observations)
            
            # HDBSCAN parameters for prototype:
            # epsilon of 10km spatial equivalent
            clusterer = hdbscan.HDBSCAN(
                metric='precomputed',
                min_cluster_size=3,
                min_samples=2,
                cluster_selection_epsilon=10.0 
            )
            
            labels = clusterer.fit_predict(dist_matrix)
            
        # Group observations by label
        clusters = {}
        for idx, label in enumerate(labels):
            if label == -1:
                continue # Noise
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(observations[idx])
            
        # Compile cluster summaries
        events = []
        for label, obs_list in clusters.items():
            # Calculate cluster centroid (simple average for prototype)
            lats = [obs.get('latitude', 0.0) for obs in obs_list]
            lons = [obs.get('longitude', 0.0) for obs in obs_list]
            center_lat = sum(lats) / len(lats)
            center_lon = sum(lons) / len(lons)
            
            # Times
            times = []
            for obs in obs_list:
                t = obs.get('observed_at')
                if isinstance(t, str):
                    t = datetime.fromisoformat(t.replace("Z", "+00:00"))
                times.append(t)
            start_time = min(times)
            last_observed_at = max(times)
            
            # Max severity
            severity = max([obs.get('severity', 1) for obs in obs_list])
            
            # Evidence confidence (weighted average)
            scores = [obs.get('trust_score', 0.0) for obs in obs_list]
            evidence_confidence = sum(scores) / len(scores)
            
            # Count verified
            verified_count = sum(1 for obs in obs_list if obs.get('verification_status') in ["HIGH_CONFIDENCE", "MEDIUM_HIGH_CONFIDENCE"])
            
            # Area (approximate bounding box area, or just a default for point clusters)
            # For prototype, we just give a small radius based area if it's a tight cluster.
            affected_area = 10.0 # Default 10 sq km
            
            events.append({
                "cluster_label": int(label),
                "event_type": obs_list[0].get('event_type', 'OTHER'),
                "latitude": center_lat,
                "longitude": center_lon,
                "start_time": start_time.isoformat(),
                "last_observed_at": last_observed_at.isoformat(),
                "severity": severity,
                "report_count": len(obs_list),
                "verified_report_count": verified_count,
                "evidence_confidence": evidence_confidence,
                "affected_area_sq_km": affected_area,
                "observations": obs_list
            })
            
        return events
