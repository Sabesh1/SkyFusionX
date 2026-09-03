import { SeverityLevel, SupportedLanguage, WeatherEventType } from './common';

export type AlertActionLevel = 'LOW_MONITOR' | 'MEDIUM_NOTIFY' | 'HIGH_WARNING' | 'CRITICAL_ESCALATION';

export type AlertDeliveryChannel = 'DASHBOARD' | 'SMS_GATEWAY' | 'MOBILE_APP_PUSH' | 'AUTHORITY_NDRF' | 'PUBLIC_SIREN';

export interface MultilingualMessage {
  en: string;
  hi: string;
  ta: string;
  te: string;
  kn: string;
  ml: string;
  bn: string;
  mr: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  alertType: WeatherEventType;
  severity: SeverityLevel;
  actionLevel: AlertActionLevel;
  affectedRegion: string;
  state: string;
  trustScore: number;
  affectedPopulation: string;
  recommendedAction: string;
  actionSummary: string;
  message: MultilingualMessage;
  deliveryChannels: AlertDeliveryChannel[];
  status: 'PENDING' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'ESCALATED' | 'DISMISSED';
  issuedAt: string;
  expiresAt: string;
  eventId?: string;
  dispatchedCount?: number;
}
