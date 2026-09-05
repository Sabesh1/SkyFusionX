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
                # Gather evidence
                from app.api.observations import _gather_evidence
                evidence = _gather_evidence(obs, db)
                
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
