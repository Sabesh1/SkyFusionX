import { MOCK_ALERTS } from '../data/mockAlerts';
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
          hi: `${ba.title}: कृपया सुरक्षित स्थान पर रहें।`,
          ta: `${ba.title}: பாதுகாப்பான இடங்களில் இருக்கவும்.`,
          te: `${ba.title}: దయచేసి సురక్షిత ప్రాంతాలకు వెళ్లండి.`,
          kn: `${ba.title}: ದಯವಿಟ್ಟು ಸುರಕ್ಷಿತವಾಗಿರಿ.`,
          ml: `${ba.title}: സുരക്ഷിതമായി തുടരുക.`,
          bn: `${ba.title}: অনুগ্রহ করে নিরাপদ স্থানে থাকুন।`,
          mr: `${ba.title}: कृपया सुरक्षित ठिकाणी राहा.`,
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

    // 2. Fallback to mock alerts
    let alerts = [...MOCK_ALERTS];
    if (filter?.severity && filter.severity !== 'ALL') {
      alerts = alerts.filter(a => a.severity === filter.severity);
    }
    if (filter?.status && filter.status !== 'ALL') {
      alerts = alerts.filter(a => a.status === filter.status);
    }
    return alerts;
  },

  async acknowledgeAlert(id: string): Promise<WeatherAlert | null> {
    const alert = MOCK_ALERTS.find(a => a.id === id);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      return { ...alert };
    }
    return null;
  },

  async escalateAlert(id: string): Promise<WeatherAlert | null> {
    const alert = MOCK_ALERTS.find(a => a.id === id);
    if (alert) {
      alert.status = 'ESCALATED';
      alert.actionLevel = 'CRITICAL_ESCALATION';
      return { ...alert };
    }
    return null;
  },

  async dismissAlert(id: string): Promise<WeatherAlert | null> {
    const alert = MOCK_ALERTS.find(a => a.id === id);
    if (alert) {
      alert.status = 'DISMISSED';
      return { ...alert };
    }
    return null;
  }
};
