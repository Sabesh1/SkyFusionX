export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'REVIEW' | 'SUSPICIOUS' | 'REJECTED' | 'VERIFYING' | 'UNVERIFIED' | 'PROCESSING';

export type WeatherEventType = 
  | 'Heavy Rainfall'
  | 'Urban Flooding'
  | 'Thunderstorm'
  | 'Cyclone'
  | 'Heatwave'
  | 'Dense Fog'
  | 'Dust Storm'
  | 'Strong Gale Winds';

export type SourceType = 
  | 'Citizen'
  | 'Social Media'
  | 'Weather Station'
  | 'Satellite'
  | 'Radar'
  | 'Drone Recon'
  | 'Official Agency'
  | 'Open-Meteo'
  | 'Citizen App';

export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // Hindi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'bn' // Bengali
  | 'mr'; // Marathi

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface KpiMetric {
  id: string;
  title: string;
  value: number | string;
  previousValue?: number | string;
  changePercent?: number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}
