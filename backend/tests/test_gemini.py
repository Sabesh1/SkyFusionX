import pytest
import asyncio
from unittest.mock import patch, MagicMock
from app.services.gemini_service import gemini_service, GeminiObservationResponse
from google.genai.errors import APIError

@pytest.fixture
def mock_gemini_client():
    with patch("app.services.gemini_service.genai.Client") as MockClient:
        mock_instance = MockClient.return_value
        yield mock_instance

@pytest.mark.asyncio
async def test_analyze_report_success():
    with patch.object(gemini_service, 'client', MagicMock()) as mock_client:
        mock_response = MagicMock()
        mock_response.parsed = GeminiObservationResponse(
            event_type="FLOOD",
            confidence=0.9,
            trust_score=85.0,
            verification_recommendation="AUTO_ACCEPT",
            reason="High detail and clear location."
        )
        
        # We need to mock the wait_for and to_thread because it's wrapped
        with patch('asyncio.wait_for', return_value=mock_response):
            result = await gemini_service.analyze_report("Heavy flooding in main street", "Chennai", "TN", "Citizen")
            
            assert result is not None
            assert result.event_type == "FLOOD"
            assert result.confidence == 0.9
            assert result.trust_score == 85.0

@pytest.mark.asyncio
async def test_analyze_report_timeout():
    with patch.object(gemini_service, 'client', MagicMock()):
        with patch('asyncio.wait_for', side_effect=asyncio.TimeoutError):
            result = await gemini_service.analyze_report("Test report")
            
            assert result is None

@pytest.mark.asyncio
async def test_chat_with_context_success():
    with patch.object(gemini_service, 'client', MagicMock()):
        mock_response = MagicMock()
        mock_response.text = "Based on the context, there is a flood warning."
        
        with patch('asyncio.wait_for', return_value=mock_response):
            result = await gemini_service.chat_with_context("Is there a flood?", "Context: Flood warning in effect.")
            
            assert "flood warning" in result

@pytest.mark.asyncio
async def test_chat_with_context_api_error():
    with patch.object(gemini_service, 'client', MagicMock()):
        with patch('asyncio.wait_for', side_effect=APIError("503 Service Unavailable", 503)):
            result = await gemini_service.chat_with_context("Is there a flood?", "Context: Flood warning in effect.")
            
            assert "external AI service error" in result
