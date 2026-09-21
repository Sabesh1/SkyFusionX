import json
from typing import List, Dict, Any

class FusionEngine:
    """
    Fuses observations and external environmental context to create a unified event picture.
    Calculates event fusion confidence, consensus, and weather corroboration.
    """

    @classmethod
    def fuse(cls, observations: List[Dict[str, Any]], weather_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Takes a list of related observations (e.g., from a cluster) and real weather context
        and returns fused metrics combining observation confidence and environmental truth.
        """
        if not observations:
            return {
                "fusion_confidence": 0.0,
                "report_count": 0,
                "verified_report_count": 0,
                "source_count": 0,
                "weather_support_flag": False,
                "contradiction_flag": False,
                "supporting_factors": []
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
        
        # 1. Event State Initialization
        from collections import Counter
        event_types = [obs.get("event_type", "OTHER") for obs in observations]
        primary_event_type = Counter(event_types).most_common(1)[0][0] if event_types else "OTHER"
        
        # 2. Weather Context Correlation
        weather_support_flag = False
        weather_contradicts = False
        if weather_context:
            w_desc = (weather_context.get("description") or "").lower()
            rain_mm = weather_context.get("rainfall_mm", 0.0)
            temp = weather_context.get("temperature_c", 25.0)
            e_type = primary_event_type.lower()
            
            if ("flood" in e_type or "rain" in e_type) and (rain_mm > 5.0 or "rain" in w_desc):
                weather_support_flag = True
            elif ("flood" in e_type or "rain" in e_type) and rain_mm == 0.0 and "clear" in w_desc:
                weather_contradicts = True
            elif "heat" in e_type and temp >= 35.0:
                weather_support_flag = True
            elif "heat" in e_type and temp < 25.0:
                weather_contradicts = True
            elif "storm" in e_type and (weather_context.get("wind_speed_kmh", 0) > 40 or "storm" in w_desc):
                weather_support_flag = True
                
        # 3. Evidence Aggregation
        contradicting_obs_count = 0
        supporting_factors = []
        
        for obs in observations:
            gemini_json_str = obs.get("gemini_evidence_json")
            if gemini_json_str:
                try:
                    gemini_data = json.loads(gemini_json_str)
                    contradicting_ev = gemini_data.get("contradicting", [])
                    if contradicting_ev:
                        contradicting_obs_count += 1
                    supporting_ev = gemini_data.get("supporting", [])
                    if supporting_ev:
                        supporting_factors.extend(supporting_ev)
                except Exception:
                    pass
                    
        # Dedup supporting factors
        supporting_factors = list(set(supporting_factors))[:5]
        
        contradiction_flag = (contradicting_obs_count / report_count) >= 0.3 if report_count > 0 else False
        
        # 4. Final Event Confidence Calculation
        base_confidence = sum(obs.get("trust_score", 0.0) for obs in observations) / report_count
        
        weather_modifier = 0.0
        if weather_support_flag:
            weather_modifier = 15.0
            supporting_factors.append("Corroborated by active weather telemetry.")
        elif weather_contradicts:
            weather_modifier = -15.0
            
        consensus_modifier = 0.0
        if source_count >= 3 and not contradiction_flag:
            consensus_modifier = 10.0
            
        contradiction_penalty = -20.0 if contradiction_flag else 0.0
        
        fused_confidence = base_confidence + weather_modifier + consensus_modifier + contradiction_penalty
        
        return {
            "fusion_confidence": max(0.0, min(100.0, round(fused_confidence, 1))),
            "report_count": report_count,
            "verified_report_count": verified_count,
            "source_count": source_count,
            "weather_support_flag": weather_support_flag,
            "contradiction_flag": contradiction_flag,
            "supporting_factors": supporting_factors
        }
