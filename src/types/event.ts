import { GeoCoordinate, SeverityLevel, WeatherEventType } from './common';

export interface TimelineItem {
  id: string;
  time: string;
  timestamp: string;
  eventTitle: string;
  description: string;
  source: string;
  severity: SeverityLevel;
  trustScore: number;
  iconType?: 'report' | 'sensor' | 'ai' | 'alert' | 'escalation';
}

export interface WeatherStationTelemetry {
  stationId: string;
  name: string;
  rainfallPastHourMm: number;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirection: string;
  barometricPressureHpa: number;
  waterLevelMeters?: number;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastPing: string;
}

export interface ClusteredWeatherEvent {
  id: string;
  title: string;
  eventName: string;
  location: string;
  state: string;
  coordinates: GeoCoordinate;
  severity: SeverityLevel;
  eventType: WeatherEventType;
  totalReports: number;
  verifiedReports: number;
  uniqueSources: number;
  affectedAreaKm2: number;
  affectedPopulationEstimate: string;
  trustScore: number;
  fusionConfidence: number;
  startTime: string;
  lastUpdate: string;
  status: 'EMERGING' | 'ESCALATING' | 'PEAK' | 'SUBSIDING' | 'CONTAINED';
  summary: string;
  recommendedAction: string;
  clusterRadiusKm: number;
  timeline: TimelineItem[];
  telemetry: WeatherStationTelemetry[];
  reportIds: string[];
}
