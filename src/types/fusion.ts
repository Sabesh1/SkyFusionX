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
  verifiedReportCount: number;
  evidenceConfidence: number;
  overallFusionConfidence: number;
  fusionVerdict: string;
  lastCalculated: string;
}
