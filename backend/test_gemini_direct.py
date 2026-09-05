import asyncio
import os
import sys

# Ensure the backend directory is in the python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.gemini_service import gemini_service
from app.core.config import settings

async def test_gemini():
    print("=" * 50)
    print("Testing Gemini Integration")
    print("=" * 50)
    print(f"Using Model: {settings.GEMINI_MODEL}")
    
    if not settings.GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY is not set in .env")
        return

    print("\n1. Testing analyze_report()...")
    sample_report = "There is a massive flood on Main Street. The water is knee-deep and rising fast. Cars are stuck."
    print(f"Report Text: '{sample_report}'")
    
    try:
        response = await gemini_service.analyze_report(
            description=sample_report,
            city="Chennai",
            state="Tamil Nadu"
        )
        if response:
            print("SUCCESS: analyze_report() worked!")
            print(f"  Event Type: {response.event_type}")
            print(f"  Confidence: {response.confidence}")
            print(f"  Trust Score: {response.trust_score}")
            print(f"  Recommendation: {response.verification_recommendation}")
            print(f"  Reason: {response.reason}")
        else:
            print("ERROR: analyze_report() returned None.")
    except Exception as e:
        print(f"ERROR: analyze_report() failed with exception: {e}")

    print("\n2. Testing chat_with_context()...")
    sample_query = "What is the recommended action?"
    sample_context = "Active Application Event: FLOOD. Risk Level: CRITICAL. Recommended Action: Activate district emergency protocols and coordinate evacuation of low-lying zones."
    
    try:
        chat_response = await gemini_service.chat_with_context(
            query=sample_query,
            context=sample_context
        )
        if chat_response:
            print("SUCCESS: chat_with_context() worked!")
            print(f"  AI Response: {chat_response}")
        else:
            print("ERROR: chat_with_context() returned empty.")
    except Exception as e:
        print(f"ERROR: chat_with_context() failed with exception: {e}")

    print("\nDone.")

if __name__ == "__main__":
    asyncio.run(test_gemini())
