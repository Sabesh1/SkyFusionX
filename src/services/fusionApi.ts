import { DataSourceHealth, EventFusionBreakdown } from '../types/fusion';
import { apiClient } from './apiClient';
import { eventApi } from './eventApi';

export const fusionApi = {
  async getDataSourceHealth(): Promise<DataSourceHealth[]> {
    return [];
  },

  async getEventFusionBreakdown(eventId: string): Promise<EventFusionBreakdown> {
    // Try to get real event data first
    try {
      const backendEvent = await eventApi.getEventDetails(eventId);
      if (backendEvent) {
        // Build a fusion breakdown from real backend data
        const citizenCount = backendEvent.totalReports || 0;
        
        return {
          eventId,
          eventName: backendEvent.title || backendEvent.eventName,
          location: backendEvent.location || 'National Surveillance Grid',
          citizenReportCount: citizenCount,
          verifiedReportCount: backendEvent.verifiedReports || 0,
          evidenceConfidence: backendEvent.trustScore || 0,
          overallFusionConfidence: backendEvent.trustScore || 0,
          fusionVerdict: backendEvent.summary || 'Data analysis complete.',
          lastCalculated: 'Just now',
        };
      }
    } catch (e) {
      console.error('Failed to fetch real fusion event', e);
    }

    return {
      eventId,
      eventName: 'Active Weather Event',
      location: 'National Surveillance Grid',
      citizenReportCount: 0,
      verifiedReportCount: 0,
      evidenceConfidence: 0,
      overallFusionConfidence: 0,
      fusionVerdict: 'Insufficient data for multi-source convergence.',
      lastCalculated: 'Unknown',
    };
  }
};
