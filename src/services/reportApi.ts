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
        title: `${br.event_type || 'Report'} Ping: ${br.city || 'Unknown Location'}`,
        text: br.content,
        locationName: br.city || 'Unknown Location',
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
          sourceCredibility: 80,
          locationMatch: 90,
          timestampValidity: 100,
          weatherApiMatch: 70,
          nearbyReports: 50,
          visualEvidence: br.media_url ? 90 : 20,
          satelliteCorrelation: 80,
        },
        aiExplanation: `Report ingested from ${br.source}. AI Recommendation: ${br.verification_recommendation || 'N/A'}.`,
        aiStatus: (() => {
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
        title: `${br.event_type || 'Report'} Ping: ${br.city || 'Unknown Location'}`,
        text: br.content,
        locationName: br.city || 'Unknown Location',
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
          sourceCredibility: 80,
          locationMatch: 90,
          timestampValidity: 100,
          weatherApiMatch: 70,
          nearbyReports: 50,
          visualEvidence: br.media_url ? 90 : 20,
          satelliteCorrelation: 80,
        },
        aiExplanation: `Report ingested from ${br.source}. AI Recommendation: ${br.verification_recommendation || 'N/A'}.`,
        aiStatus: br.verification_status === 'PROCESSING' ? 'PROCESSING' : (br.model_version?.includes('gemini') ? 'GEMINI ANALYZED' : (br.model_version === 'v1' ? 'FALLBACK' : 'FAILED')),
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
        duplicateOfId: br.duplicate_of_id
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
    state?: string;
    event_type?: string;
    severity?: number;
    media_url?: string;
  }): Promise<{ status: string; observation_id: string } | null> {
    const res = await apiClient.post<{ status: string; observation_id: string }>(
      '/api/v1/observations',
      {
        source: reportData.source || 'Citizen App',
        source_event_id: `CIT-${Date.now()}`,
        observed_at: reportData.observed_at || new Date().toISOString(),
        content: reportData.content,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        city: reportData.city || 'Unknown',
        state: reportData.state || 'Unknown',
        event_type: reportData.event_type || 'OTHER',
        severity: reportData.severity || 1,
        media_url: reportData.media_url,
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
    // Generate a real report in the backend instead of just returning a mock
    const res = await this.submitReport({
        source: 'Citizen App',
        content: 'Auto-generated test report via UI button',
        latitude: 12.9716,
        longitude: 77.5946,
        city: 'Bengaluru',
        state: 'Karnataka'
    });
    
    if (res && res.observation_id) {
        return this.getReportById(res.observation_id);
    }
    return null;
  }
};
