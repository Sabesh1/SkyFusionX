import { WeatherReport } from '../types/report';
import { apiClient } from './apiClient';

export interface ReportFilterParams {
  state?: string;
  severity?: string;
  status?: string;
  search?: string;
  source?: string;
}

export const reportApi = {
  async getLiveReports(filter?: ReportFilterParams): Promise<WeatherReport[]> {
    let query = '';
    const params = new URLSearchParams();
    if (filter?.state && filter.state !== 'ALL') params.append('state', filter.state);
    if (filter?.severity && filter.severity !== 'ALL') params.append('severity', filter.severity);
    if (filter?.status && filter.status !== 'ALL') params.append('verification_status', filter.status);
    
    if (params.toString()) {
      query = `?${params.toString()}`;
    }

    const backendReports = await apiClient.get<any[]>(`/api/v1/observations${query}`);
    
    if (backendReports && backendReports.length > 0) {
      let mapped = backendReports.map(br => ({
        id: br.id,
        title: `${br.event_type || 'Report'} Ping: ${br.city || br.resolved_city || 'Unknown Location'}`,
        text: br.content,
        city: br.city || br.resolved_city || 'Unknown Location',
        version: br.version ?? 0,
        locationName: br.city || br.resolved_city || 'Unknown Location',
        district: br.district || 'Unknown District',
        state: br.state || 'Unknown State',
        coordinates: { lat: br.latitude, lng: br.longitude },
        event: br.event_type || 'Unknown Event',
        source: br.source || 'Citizen App',
        sourceHandle: `@user_${br.source_event_id || '123'}`,
        sourceReputation: Math.round(br.trust_score ?? 50),
        trustScore: Math.round(br.trust_score ?? 50),
        status: br.verification_status || 'UNDER_REVIEW',
        severity: typeof br.severity === 'number' 
          ? (br.severity >= 4 ? 'CRITICAL' : br.severity === 3 ? 'HIGH' : 'MODERATE') 
          : 'MODERATE',
        timestamp: br.observed_at,
        evidence: br.media_url ? [{ type: 'image' as const, url: br.media_url, capturedAt: br.observed_at, hasExifData: false }] : [],
        verificationFactors: {
          sourceCredibility: Math.round(br.trust_score * 0.9) || 80,
          locationMatch: Math.round(br.location_confidence ? br.location_confidence * 100 : 90),
          timestampValidity: 95,
          weatherApiMatch: br.weather_score || 85,
          nearbyReports: br.nearby_reports_score || 70,
          visualEvidence: br.image_analyzed ? 90 : (br.media_url ? 60 : 20),
          satelliteCorrelation: 80,
        },
        aiExplanation: br.verification_assessment || `Report ingested from ${br.source}. AI Recommendation: ${br.verification_recommendation || 'N/A'}.`,
        aiStatus: (() => {
          if (br.verification_status === 'VERIFIED') return 'AI VERIFIED';
          if (br.verification_status === 'REJECTED') return 'AI FLAGGED';
          if (br.verification_status === 'UNDER_REVIEW') return 'HUMAN REVIEW REQUIRED';
          if (br.verification_status === 'PROCESSING') return 'PROCESSING';
          if (br.gemini_analyzed === true) return 'GEMINI ANALYZED';
          if (br.model_version?.includes('gemini')) return 'GEMINI ANALYZED';
          if (br.model_version === 'v1' || br.model_version?.includes('v1')) return 'ML ANALYZED';
          if (br.model_version === 'fallback' || br.model_version === 'none') return 'FALLBACK';
          return 'PROCESSING';
        })(),
        modelVersion: br.model_version,
        mlEventType: br.ml_event_type,
        mlConfidence: br.ml_confidence,
        verificationRecommendation: br.verification_recommendation,
        matchedStationId: 'AWS-LIVE',
        matchedStationDistanceKm: 5.0,
        matchedStationRainfallMm: 0.0,
        duplicateCount: 0,
        resolvedCity: br.resolved_city,
        resolvedState: br.resolved_state,
        locationConfidence: br.location_confidence,
        isDuplicate: br.is_duplicate,
        duplicateGroupId: br.duplicate_group_id,
        duplicateSimilarity: br.duplicate_similarity,
        duplicateOfId: br.duplicate_of_id,
        geminiAnalyzed: br.gemini_analyzed || false,
        imageAnalyzed: br.image_analyzed || false,
        verificationAssessment: br.verification_assessment,
        geminiEvidence: (() => {
          if (!br.gemini_evidence_json) return null;
          try { return JSON.parse(br.gemini_evidence_json); } catch { return null; }
        })()
      }));
      
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        mapped = mapped.filter(r => 
          r.title.toLowerCase().includes(q) || 
          r.text.toLowerCase().includes(q) || 
          r.locationName.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q)
        );
      }
      return mapped as WeatherReport[];
    }
    
    return [];
  },

  async getReportById(id: string): Promise<WeatherReport | null> {
    const br = await apiClient.get<any>(`/api/v1/observations/${id}`);
    if (br) {
      return {
        id: br.id,
        title: `${br.event_type || 'Report'} Ping: ${br.city || br.resolved_city || 'Unknown Location'}`,
        text: br.content,
        city: br.city || br.resolved_city || 'Unknown Location',
        version: br.version ?? 0,
        locationName: br.city || br.resolved_city || 'Unknown Location',
        district: br.district || 'Unknown District',
        state: br.state || 'Unknown State',
        coordinates: { lat: br.latitude, lng: br.longitude },
        event: br.event_type || 'Unknown Event',
        source: br.source || 'Citizen App',
        sourceHandle: `@user_${br.source_event_id || '123'}`,
        sourceReputation: Math.round(br.trust_score ?? 50),
        trustScore: Math.round(br.trust_score ?? 50),
        status: br.verification_status || 'UNDER_REVIEW',
        severity: typeof br.severity === 'number' 
          ? (br.severity >= 4 ? 'CRITICAL' : br.severity === 3 ? 'HIGH' : 'MODERATE') 
          : 'MODERATE',
        timestamp: br.observed_at,
        evidence: br.media_url ? [{ type: 'image' as const, url: br.media_url, capturedAt: br.observed_at, hasExifData: false }] : [],
        verificationFactors: {
          sourceCredibility: Math.round(br.trust_score * 0.9) || 80,
          locationMatch: Math.round(br.location_confidence ? br.location_confidence * 100 : 90),
          timestampValidity: 95,
          weatherApiMatch: br.weather_score || 85,
          nearbyReports: br.nearby_reports_score || 70,
          visualEvidence: br.image_analyzed ? 90 : (br.media_url ? 60 : 20),
          satelliteCorrelation: 80,
        },
        aiExplanation: br.verification_assessment || `Report ingested from ${br.source}. AI Recommendation: ${br.verification_recommendation || 'N/A'}.`,
        aiStatus: (() => {
          if (br.verification_status === 'VERIFIED') return 'AI VERIFIED';
          if (br.verification_status === 'REJECTED') return 'AI FLAGGED';
          if (br.verification_status === 'UNDER_REVIEW') return 'HUMAN REVIEW REQUIRED';
          if (br.verification_status === 'PROCESSING') return 'PROCESSING';
          if (br.gemini_analyzed) return 'GEMINI ANALYZED';
          return 'FALLBACK';
        })(),
        modelVersion: br.model_version,
        mlEventType: br.ml_event_type,
        mlConfidence: br.ml_confidence,
        verificationRecommendation: br.verification_recommendation,
        matchedStationId: 'AWS-LIVE',
        matchedStationDistanceKm: 5.0,
        matchedStationRainfallMm: 0.0,
        duplicateCount: 0,
        
        resolvedCity: br.resolved_city,
        resolvedState: br.resolved_state,
        locationConfidence: br.location_confidence,
        
        isDuplicate: br.is_duplicate,
        duplicateGroupId: br.duplicate_group_id,
        duplicateSimilarity: br.duplicate_similarity,
        duplicateOfId: br.duplicate_of_id,
        geminiAnalyzed: br.gemini_analyzed || false,
        imageAnalyzed: br.image_analyzed || false,
        verificationAssessment: br.verification_assessment,
        geminiEvidence: (() => {
          if (!br.gemini_evidence_json) return null;
          try { return JSON.parse(br.gemini_evidence_json); } catch { return null; }
        })()
      } as WeatherReport;
    }
    return null;
  },

  async submitReport(reportData: {
    source: string;
    content: string;
    latitude: number;
    longitude: number;
    observed_at?: string;
    city?: string;
    district?: string;
    state?: string;
    event_type?: string;
    severity?: number;
    media_url?: string;
    content_hash?: string;
    raw_payload?: Record<string, unknown>;
  }): Promise<{ status: string; observation_id: string } | null> {
    const contentHash = reportData.content_hash || (() => {
      const raw = `${reportData.content}|${reportData.latitude}|${reportData.longitude}|${reportData.observed_at || new Date().toISOString()}`;
      return Array.from(new TextEncoder().encode(raw)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    })();

    const res = await apiClient.post<{ status: string; observation_id: string }>(
      '/api/v1/observations',
      {
        source: (reportData.source || 'citizen_app').toLowerCase().replace(/\s+/g, '_'),
        source_event_id: `CIT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        observed_at: reportData.observed_at || new Date().toISOString(),
        content: reportData.content,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        city: reportData.city || 'Unknown',
        district: reportData.district || reportData.city || 'Unknown',
        state: reportData.state || 'Unknown',
        event_type: reportData.event_type || 'OTHER',
        severity: Math.min(5, Math.max(1, reportData.severity || 1)),
        media_url: reportData.media_url || undefined,
        content_hash: contentHash,
        raw_payload: reportData.raw_payload || {
          source: (reportData.source || 'citizen_app').toLowerCase().replace(/\s+/g, '_'),
          observed_at: reportData.observed_at || new Date().toISOString(),
          city: reportData.city || 'Unknown',
          state: reportData.state || 'Unknown',
          event_type: reportData.event_type || 'OTHER',
        },
        is_mock: false,
      }
    );
    return res;
  },

  async verifyReport(id: string): Promise<WeatherReport | null> {
    const res = await apiClient.patch<any>(`/api/v1/observations/${id}`, {
      verification_status: 'VERIFIED'
    });
    if (res) {
      return this.getReportById(id);
    }
    return null;
  },

  async reprocessReport(id: string): Promise<{ status: string; observation_id: string } | null> {
    const res = await apiClient.post<{ status: string; observation_id: string }>(`/api/v1/observations/${id}/reprocess`, {});
    return res;
  },

  async deleteReport(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/v1/observations/${id}`);
      return true;
    } catch (e) {
      console.error("Failed to delete report", e);
      return false;
    }
  },

  async generateMockLiveReport(): Promise<WeatherReport | null> {
    // Return a local mock instead of spamming the backend database
    const mockReport: WeatherReport = {
        id: `MOCK-${Date.now()}`,
        title: 'Report Ping: Bengaluru',
        text: 'Auto-generated test report via UI button',
        city: 'Bengaluru',
        version: 1,
        locationName: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        coordinates: { lat: 12.9716, lng: 77.5946 },
        event: 'Heavy Rainfall',
        source: 'Citizen App',
        sourceHandle: '@mock_user',
        sourceReputation: 50,
        trustScore: 70 + (Date.now() % 28),
        status: 'UNDER_REVIEW',
        severity: 'MODERATE',
        timestamp: new Date().toISOString(),
        evidence: [],
        verificationFactors: {
            sourceCredibility: 80,
            locationMatch: 90,
            timestampValidity: 95,
            weatherApiMatch: 85,
            nearbyReports: 70,
            visualEvidence: 20,
            satelliteCorrelation: 80
        },
        aiExplanation: 'Auto-generated mock report for UI testing.',
        aiStatus: 'FALLBACK',
        modelVersion: 'fallback',
        isDuplicate: false,
        geminiAnalyzed: false,
        imageAnalyzed: false
    };
    return mockReport;
  }
};
