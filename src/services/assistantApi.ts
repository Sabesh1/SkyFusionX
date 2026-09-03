import { AssistantMessage, AssistantSourceChip } from '../types/assistant';

/**
 * AI Copilot Frontend Service
 * Calls the backend /api/v1/copilot/chat which handles:
 *   - NLP intent + location extraction (case-insensitive)
 *   - Open-Meteo Geocoding for India location confirmation
 *   - Open-Meteo Forecast for real-world live weather
 *   - Application DB events for risk/alert context
 */

interface BackendChatResponse {
  id: string;
  sender: string;
  timestamp: string;
  text: string;
  sourceChips: Array<{ name: string; type: string }>;
  relatedEventId?: string;
}

function safeTime(raw?: string | null): string {
  if (!raw) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch (_) {}
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const assistantApi = {
  async askWeatherAssistant(query: string, history: AssistantMessage[]): Promise<AssistantMessage> {
    const validTime = safeTime(new Date().toISOString()); // never "Invalid Date"

    try {
      const res = await fetch('/api/v1/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: history.map(m => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })),
        }),
      });

      if (res.ok) {
        const data: BackendChatResponse = await res.json();
        return {
          id: data.id || `MSG-AI-${Date.now()}`,
          sender: 'assistant',
          timestamp: safeTime(data.timestamp), // fix Invalid Date
          text: data.text || 'No response from AI engine.',
          sourceChips: (data.sourceChips || []) as AssistantSourceChip[],
          relatedEventId: data.relatedEventId,
        };
      }
    } catch (e) {
      console.error('[Copilot] Backend request failed:', e);
    }

    // Truthful offline fallback — never hallucinate
    return {
      id: `MSG-AI-${Date.now()}`,
      sender: 'assistant',
      timestamp: validTime,
      text: '⚠️ The AI Copilot backend is currently unreachable. Please ensure the FastAPI server is running on port 8000.',
      sourceChips: [{ name: 'Backend Offline', type: 'ai' }],
    };
  },
};
