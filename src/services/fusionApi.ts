import { MOCK_DATA_SOURCES, MOCK_EVENT_FUSIONS } from '../data/mockFusion';
import { DataSourceHealth, EventFusionBreakdown } from '../types/fusion';

export const fusionApi = {
  async getDataSourceHealth(): Promise<DataSourceHealth[]> {
    return MOCK_DATA_SOURCES;
  },

  async getEventFusionBreakdown(eventId: string): Promise<EventFusionBreakdown> {
    return MOCK_EVENT_FUSIONS[eventId] || {
      eventId,
      eventName: 'Active Weather Event',
      location: 'National Surveillance Grid',
      citizenReportCount: 140,
      weatherStationCount: 5,
      satelliteCorrelationPct: 82,
      radarCorrelationPct: 80,
      apiCorrelationPct: 85,
      socialSignalsScorePct: 78,
      overallFusionConfidence: 83,
      fusionVerdict: 'Standard multi-source data convergence.',
      lastCalculated: '1 min ago',
    };
  }
};
