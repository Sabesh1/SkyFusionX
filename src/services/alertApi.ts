import { WeatherAlert, AlertActionLevel, MultilingualMessage } from '../types/alert';
import { SeverityLevel } from '../types/common';
import { apiClient } from './apiClient';

interface BackendAlert {
  alert_id: string;
  event_id: string;
  alert_level: string;
  title: string;
  message: string;
  risk_score: number;
  generated_at?: string;
  delivery_status?: string;
  language?: string;
}

export const alertApi = {
  async getAlerts(filter?: { severity?: string; status?: string }): Promise<WeatherAlert[]> {
    // 1. Try FastAPI backend
    const backendAlerts = await apiClient.get<BackendAlert[]>('/api/v1/alerts');
    if (backendAlerts && backendAlerts.length > 0) {
      return backendAlerts.map(ba => {
        const sev: SeverityLevel = (ba.alert_level === 'CRITICAL' || ba.alert_level === 'RED'
          ? 'CRITICAL'
          : ba.alert_level === 'HIGH' || ba.alert_level === 'ORANGE'
          ? 'HIGH'
          : 'MODERATE');

        const actLevel: AlertActionLevel = sev === 'CRITICAL' ? 'CRITICAL_ESCALATION' : sev === 'HIGH' ? 'HIGH_WARNING' : 'MEDIUM_NOTIFY';

        const multiMsg: MultilingualMessage = {
          en: ba.message,
          // Let UI handle dynamic fetching and caching instead of hardcoded strings
        };

        return {
          id: ba.alert_id,
          title: ba.title,
          alertType: 'Urban Flooding',
          severity: sev,
          actionLevel: actLevel,
          affectedRegion: 'Chennai South Basin',
          state: 'Tamil Nadu',
          trustScore: Math.round(ba.risk_score || 88),
          affectedPopulation: '140,000 residents',
          recommendedAction: 'Move to elevated areas, avoid subways.',
          actionSummary: 'Immediate evacuation for low-lying areas.',
          message: multiMsg,
          deliveryChannels: ['DASHBOARD', 'SMS_GATEWAY', 'AUTHORITY_NDRF'],
          status: 'DISPATCHED',
          issuedAt: ba.generated_at || new Date().toISOString(),
          expiresAt: new Date(Date.now() + 14400000).toISOString(),
          eventId: ba.event_id,
        };
      });
    }

    return [];
  },

  async acknowledgeAlert(id: string): Promise<WeatherAlert | null> {
    return null;
  },

  async escalateAlert(id: string): Promise<WeatherAlert | null> {
    return null;
  },

  async dismissAlert(id: string): Promise<WeatherAlert | null> {
    return null;
  },

  async translateAlert(id: string, language: string): Promise<{ translated_text: string, error?: string } | null> {
    try {
      const result = await apiClient.post<{ translated_text: string, error?: string }>(`/api/v1/alerts/${id}/translate`, { language });
      return result;
    } catch (e) {
      console.error('Translation failed', e);
      return null;
    }
  }
};
