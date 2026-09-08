import { SeverityLevel } from './common';

export interface ClusterDetail {
  id: string;
  clusterName: string;
  location: string;
  severity: SeverityLevel;
  trustScore: number;
  rawReportCount: number;
  deduplicatedEventsCount: number;
  duplicateReductionPct: number;
  clusterRadiusKm: number;
  activeWindowMinutes: number;
  sourceDistribution: {
    citizen: number;
    social: number;
    official: number;
    sensor: number;
  };
}
