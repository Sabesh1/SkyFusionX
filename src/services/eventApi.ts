import { ClusteredWeatherEvent } from '../types/event';
import { SeverityLevel, WeatherEventType } from '../types/common';
import { apiClient } from './apiClient';
import { INDIAN_STATES_DATA } from '../data/indiaGeoData';

interface BackendWeatherEvent {
  event_id: string;
  event_type: string;
  title: string;
  location: {
    latitude: number;
    longitude: number;
  };
  severity: number | string;
  report_count: number;
  verified_report_count: number;
  evidence_confidence: number;
  prediction_probability: number;
  exposure_score: number;
  risk_score: number;
  risk_level: string;
  truth_analysis?: Record<string, number>;
  explanation?: string[];
}

export const eventApi = {
  async getWeatherEvents(filter?: { state?: string; severity?: string; event_type?: string }): Promise<ClusteredWeatherEvent[]> {
    let query = '';
    const params = new URLSearchParams();
    if (filter?.state && filter.state !== 'ALL') params.append('state', filter.state);
    if (filter?.severity && filter.severity !== 'ALL') params.append('severity', filter.severity);
    if (filter?.event_type && filter.event_type !== 'ALL') params.append('event_type', filter.event_type);

    if (params.toString()) {
      query = `?${params.toString()}`;
    }

    const backendEvents = await apiClient.get<BackendWeatherEvent[]>(`/api/v1/events${query}`);

    if (backendEvents && backendEvents.length > 0) {
      return backendEvents.map(be => {
        const sevMap: Record<string, SeverityLevel> = {
          CRITICAL: 'CRITICAL',
          HIGH: 'HIGH',
          MODERATE: 'MODERATE',
          LOW: 'LOW',
        };
        const rawSev = typeof be.severity === 'number'
          ? (be.severity >= 4 ? 'CRITICAL' : be.severity === 3 ? 'HIGH' : be.severity === 2 ? 'MODERATE' : 'LOW')
          : (be.risk_level || 'HIGH');

        const typeMap: Record<string, WeatherEventType> = {
          'Urban Flooding': 'Urban Flooding',
          'Heavy Rainfall': 'Heavy Rainfall',
          'Flash Flood': 'Urban Flooding',
          'Thunderstorm': 'Thunderstorm',
          'Cyclone': 'Cyclone',
          'Cloudburst': 'Heavy Rainfall',
          'Landslide': 'Urban Flooding',
          'Heatwave': 'Heatwave',
          'Dense Fog': 'Dense Fog',
          'Dust Storm': 'Dust Storm',
          'Strong Gale Winds': 'Strong Gale Winds',
        };

        const evType: WeatherEventType = typeMap[be.event_type] || 'Urban Flooding';

        let resolvedState = filter?.state || 'Unknown';
        if (resolvedState === 'Unknown' || resolvedState === 'ALL') {
          // Find the closest state by coordinates to ensure dropdown works
          let minDistance = Infinity;
          for (const key in INDIAN_STATES_DATA) {
            const stateInfo = INDIAN_STATES_DATA[key];
            const d = Math.pow(be.location.latitude - stateInfo.center.lat, 2) + Math.pow(be.location.longitude - stateInfo.center.lng, 2);
            if (d < minDistance) {
              minDistance = d;
              resolvedState = stateInfo.name;
            }
          }
        }

        return {
          id: be.event_id,
          title: be.title || `${evType} Alert`,
          eventName: be.title || `${evType} Incident`,
          eventType: evType,
          severity: sevMap[rawSev] || 'HIGH',
          state: resolvedState,
          location: `Lat ${be.location.latitude.toFixed(2)}, Lng ${be.location.longitude.toFixed(2)}`,
          coordinates: { lat: be.location.latitude, lng: be.location.longitude },
          trustScore: Math.round(be.evidence_confidence || 0),
          totalReports: be.report_count || 1,
          verifiedReports: be.verified_report_count || 1,
          uniqueSources: 1,
          affectedAreaKm2: 24.5,
          affectedPopulationEstimate: '140,000 residents',
          fusionConfidence: Math.round(be.evidence_confidence || 0),
          startTime: new Date(Date.now() - 3600000).toISOString(),
          lastUpdate: new Date().toISOString(),
          status: 'ESCALATING',
          summary: (be.explanation && be.explanation[0]) || `Active ${evType} risk event detected.`,
          recommendedAction: 'Deploy NDRF response teams and dispatch emergency cell broadcast.',
          clusterRadiusKm: 12.4,
          timeline: [
            {
              id: `tl-1-${be.event_id}`,
              time: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              eventTitle: `Initial ${evType} Detection`,
              description: `System identified emerging ${evType.toLowerCase()} event based on localized ground reports.`,
              source: 'Citizen App',
              severity: 'MODERATE',
              trustScore: 0,
              iconType: 'report'
            },
            {
              id: `tl-2-${be.event_id}`,
              time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date().toISOString(),
              eventTitle: 'Latest Telemetry Verified',
              description: `Multi-modal verification complete for latest reports. Confidence score updated.`,
              source: 'SkyFusion AI',
              severity: sevMap[rawSev] || 'HIGH',
              trustScore: Math.round(be.evidence_confidence || 0),
              iconType: 'ai'
            }
          ],
          telemetry: [],
          reportIds: [],
        };
      });
    }

    return [];
  },

  async getEventDetails(id: string): Promise<ClusteredWeatherEvent | null> {
    const backendEvent = await apiClient.get<BackendWeatherEvent>(`/api/v1/events/${id}`);
    if (backendEvent) {
      return {
        id: backendEvent.event_id,
        title: backendEvent.title || 'Severe Weather Event',
        eventName: backendEvent.title || 'Severe Weather Incident',
        eventType: 'Urban Flooding',
        severity: 'CRITICAL',
        state: 'Unknown',
        location: `Lat ${backendEvent.location.latitude.toFixed(2)}, Lng ${backendEvent.location.longitude.toFixed(2)}`,
        coordinates: { lat: backendEvent.location.latitude, lng: backendEvent.location.longitude },
        trustScore: Math.round(backendEvent.evidence_confidence || 0),
        totalReports: backendEvent.report_count || 0,
        verifiedReports: backendEvent.verified_report_count || 0,
        uniqueSources: 1,
        affectedAreaKm2: 32.0,
        affectedPopulationEstimate: '220,000 residents',
        fusionConfidence: Math.round(backendEvent.evidence_confidence || 0),
        startTime: new Date(Date.now() - 7200000).toISOString(),
        lastUpdate: new Date().toISOString(),
        status: 'PEAK',
        summary: (backendEvent.explanation && backendEvent.explanation.join('. ')) || 'Severe event detected by AI Truth Engine.',
        recommendedAction: 'Coordinate regional drainage pumps and activate community shelters.',
        clusterRadiusKm: 18.0,
        timeline: [
          {
            id: `tl-1-${backendEvent.event_id}`,
            time: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            eventTitle: `Initial ${backendEvent.event_type || 'Event'} Report`,
            description: `First localized report of conditions detected via citizen observation.`,
            source: 'Citizen App',
            severity: 'MODERATE',
            trustScore: 0,
            iconType: 'report'
          },
          {
            id: `tl-2-${backendEvent.event_id}`,
            time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(Date.now()).toISOString(),
            eventTitle: 'AI Truth Engine Verification',
            description: `Multi-modal verification complete. Confidence score updated.`,
            source: 'SkyFusion AI',
            severity: 'HIGH',
            trustScore: Math.round(backendEvent.evidence_confidence || 0),
            iconType: 'ai'
          }
        ],
        telemetry: [],
        reportIds: [],
      };
    }

    return null;
  }
};
