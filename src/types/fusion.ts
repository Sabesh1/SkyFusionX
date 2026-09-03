export interface DataSourceHealth {
  id: string;
  name: string;
  type: 'satellite' | 'stations' | 'citizen' | 'radar' | 'apis' | 'social';
  status: 'ONLINE' | 'DEGRADED' | 'DISCONNECTED';
  activeNodes: number | string;
  throughputRate: string;
  latestSyncTime: string;
  latencyMs: number;
  reliabilityScore: number;
  description: string;
}

export interface EventFusionBreakdown {
  eventId: string;
  eventName: string;
  location: string;
  citizenReportCount: number;
  weatherStationCount: number;
  satelliteCorrelationPct: number;
  radarCorrelationPct: number;
  apiCorrelationPct: number;
  socialSignalsScorePct: number;
  overallFusionConfidence: number;
  fusionVerdict: string;
  lastCalculated: string;
}
