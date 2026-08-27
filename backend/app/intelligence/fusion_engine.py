from typing import List, Dict, Any

class FusionEngine:
    """
    Fuses observations to create a stronger evidence picture.
    Calculates fused confidence, report counts, and unique source counts.
    """

    @classmethod
    def fuse(cls, observations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Takes a list of related observations (e.g., from a cluster)
        and returns fused metrics without destroying the original data.
        """
        if not observations:
            return {
                "fused_confidence": 0.0,
                "report_count": 0,
                "verified_report_count": 0,
                "source_count": 0
            }

        report_count = len(observations)
        
        # Count verified
        verified_count = 0
        for obs in observations:
            status = obs.get("verification_status", "")
            if status in ["HIGH_CONFIDENCE", "MEDIUM_HIGH_CONFIDENCE"]:
                verified_count += 1
                
        # Count unique sources
        sources = set(obs.get("source", "Unknown") for obs in observations)
        source_count = len(sources)
        
        # Calculate fused confidence
        # A simple average is not enough; multiple independent sources increase confidence.
        base_confidence = sum(obs.get("trust_score", 0.0) for obs in observations) / report_count
        
        # Bonus for multiple sources (up to +15)
        source_bonus = min(15.0, (source_count - 1) * 5.0)
        
        # Bonus for high number of verified reports (up to +15)
        verification_bonus = min(15.0, verified_count * 2.0)
        
        fused_confidence = base_confidence + source_bonus + verification_bonus
        
        return {
            "fused_confidence": max(0.0, min(100.0, round(fused_confidence, 1))),
            "report_count": report_count,
            "verified_report_count": verified_count,
            "source_count": source_count
        }
