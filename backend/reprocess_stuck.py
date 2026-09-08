"""
Fix stuck PROCESSING observations by running them through Gemini evidence analysis.
Windows-safe (no Unicode emoji in print statements).
"""
import os, sys, asyncio, json, datetime, logging

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Load env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

from app.core.database import SessionLocal
from app.models.observation import Observation
from app.core.config import settings

async def reprocess_all():
    db = SessionLocal()
    try:
        # Find all stuck observations
        stuck = db.query(Observation).filter(
            Observation.verification_status.in_(["PROCESSING", "UNVERIFIED"])
        ).all()
        
        unanalyzed = db.query(Observation).filter(
            Observation.gemini_analyzed == False
        ).all()
        
        # Merge unique
        all_ids = set()
        all_obs = []
        for obs in stuck + unanalyzed:
            if obs.id not in all_ids:
                all_ids.add(obs.id)
                all_obs.append(obs)
        
        print(f"\nFound {len(all_obs)} observations to reprocess")
        print(f"  Stuck in PROCESSING/UNVERIFIED: {len(stuck)}")
        print(f"  Gemini not analyzed: {len(unanalyzed)}")
        print(f"  Model: {settings.GEMINI_MODEL}")
        print(f"  API Key set: {bool(settings.GEMINI_API_KEY)}")
        print(f"  Timeout: {settings.GEMINI_TIMEOUT_SECONDS}s, Retries: {settings.GEMINI_MAX_RETRIES}")
        print()
        
        from app.services.gemini_service import gemini_service
        
        if not gemini_service.client:
            print("ERROR: Gemini client not initialized! Check GEMINI_API_KEY.")
            return
        
        # Quick test
        print("Testing Gemini connectivity...")
        try:
            from google import genai
            test_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            test_resp = test_client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents="Reply with exactly: OK"
            )
            print(f"  Gemini test result: {test_resp.text.strip()}")
        except Exception as e:
            print(f"  Gemini test FAILED: {e}")
            print("  Will attempt processing anyway...")
        
        success = 0
        failed = 0
        
        for i, obs in enumerate(all_obs):
            print(f"\n[{i+1}/{len(all_obs)}] Processing: {obs.id[:16]}... | {obs.city or 'Unknown'}, {obs.state or 'Unknown'}")
            desc_preview = (obs.content or '')[:80].encode('ascii', errors='replace').decode('ascii')
            print(f"  Content: {desc_preview}...")
            
            try:
                if obs.is_mock:
                    print("  [SKIP] Mock data skipped.")
                    obs.verification_status = "UNVERIFIED"
                    obs.gemini_analyzed = True
                    db.commit()
                    continue

                # Gather evidence
                from app.api.observations import _gather_evidence, _decode_image_from_url
                evidence = _gather_evidence(obs, db)
                
                import hashlib
                import json as _json
                img_hash = None
                cached_obs = None
                
                image_bytes, _ = _decode_image_from_url(obs.media_url)
                if image_bytes:
                    img_hash = hashlib.sha256(image_bytes).hexdigest()
                    obs.image_hash = img_hash
                    
                    cached_obs = db.query(Observation).filter(
                        Observation.image_hash == img_hash,
                        Observation.image_analyzed_state == "ANALYZED",
                        Observation.id != obs.id
                    ).first()

                if cached_obs:
                    print(f"  [CACHE HIT] Reusing previous analysis from {cached_obs.id}.")
                    from app.services.gemini_service import GeminiEvidenceResponse
                    try:
                        cached_json = _json.loads(cached_obs.gemini_evidence_json) if cached_obs.gemini_evidence_json else {}
                    except _json.JSONDecodeError:
                        cached_json = {}
                        
                    gemini_res = GeminiEvidenceResponse(
                        trust_score=cached_obs.trust_score or 50,
                        confidence=cached_obs.ml_confidence or 0.5,
                        event_type=cached_obs.ml_event_type or "OTHER",
                        recommendation=cached_obs.verification_recommendation or "REQUIRES_HUMAN_REVIEW",
                        supporting_evidence=cached_json.get("supporting", []),
                        contradicting_evidence=cached_json.get("contradicting", []),
                        evidence_assessment=cached_json.get("assessment", "Reused"),
                        reason="Reused analysis from visually identical image",
                        verification_status=cached_json.get("verification_status", "INSUFFICIENT_EVIDENCE"),
                        image_analyzed=True
                    )
                else:
                    # Call Gemini
                    gemini_res = await gemini_service.analyze_report_with_evidence(
                        description=obs.content,
                        city=obs.resolved_city or obs.city,
                        state=obs.resolved_state or obs.state,
                        source_type=obs.source,
                        report_timestamp=obs.observed_at.isoformat() if obs.observed_at else None,
                        weather_context=evidence["weather_context"],
                        nearby_observations=evidence["nearby_observations"],
                        related_events=evidence["related_events"],
                        existing_ml=evidence["existing_ml"],
                    )
                
                if gemini_res:
                    obs.gemini_analyzed = True
                    obs.image_analyzed = gemini_res.image_analyzed
                    if image_bytes and not cached_obs:
                        obs.image_analyzed_state = "ANALYZED"
                    elif image_bytes and cached_obs:
                        obs.image_analyzed_state = "ANALYZED"
                    obs.trust_score = gemini_res.trust_score
                    obs.ml_confidence = gemini_res.confidence
                    obs.ml_event_type = gemini_res.event_type
                    obs.verification_recommendation = gemini_res.recommendation
                    obs.verification_assessment = gemini_res.verification_status
                    obs.model_version = settings.GEMINI_MODEL
                    obs.ml_processed_at = datetime.datetime.utcnow()
                    obs.verification_status = "UNVERIFIED"
                    obs.gemini_evidence_json = json.dumps({
                        "supporting": gemini_res.supporting_evidence,
                        "contradicting": gemini_res.contradicting_evidence,
                        "assessment": gemini_res.evidence_assessment,
                        "reason": gemini_res.reason,
                        "verification_status": gemini_res.verification_status,
                        "image_analyzed": gemini_res.image_analyzed,
                    })
                    db.commit()
                    success += 1
                    print(f"  [OK] Trust={gemini_res.trust_score:.0f} Event={gemini_res.event_type} Status={gemini_res.verification_status}")
                else:
                    # Mark as fallback so it's no longer stuck
                    obs.gemini_analyzed = False
                    obs.verification_status = "UNVERIFIED"
                    obs.verification_recommendation = "REQUIRES_HUMAN_REVIEW"
                    obs.verification_assessment = "INSUFFICIENT_EVIDENCE"
                    obs.model_version = "fallback"
                    obs.gemini_evidence_json = json.dumps({
                        "supporting": [],
                        "contradicting": [],
                        "assessment": "Gemini analysis was not available. Results are from fallback heuristics only.",
                        "reason": "AI analysis unavailable - fallback used.",
                        "verification_status": "INSUFFICIENT_EVIDENCE",
                        "image_analyzed": False,
                    })
                    db.commit()
                    failed += 1
                    print(f"  [FALLBACK] Gemini returned None - fallback applied")
                    
                # Delay to avoid rate limiting (longer between requests)
                await asyncio.sleep(3)
                
            except Exception as e:
                failed += 1
                err_msg = str(e).encode('ascii', errors='replace').decode('ascii')
                print(f"  [ERROR] {err_msg}")
                try:
                    db.rollback()
                except Exception:
                    pass
                await asyncio.sleep(4)
        
        print(f"\n{'='*50}")
        print(f"DONE: {success} succeeded, {failed} failed out of {len(all_obs)}")
        print(f"{'='*50}")
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(reprocess_all())
