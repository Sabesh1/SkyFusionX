import { VerificationFactors } from '../types/report';
import { WeatherEventType } from '../types/common';
import { apiClient } from './apiClient';

export interface ImageVerificationResult {
  id: string;
  title: string;
  url: string;
  fileName: string;
  detectedEvent: WeatherEventType;
  aiConfidence: number;
  authenticityScore: number;
  tamperRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'HIGHLY LIKELY AUTHENTIC' | 'SUSPICIOUS' | 'LIKELY MANIPULATED';
  explanation: string;
  evidenceJson?: any;
}

export const aiApi = {
  calculateTrustScore(factors: VerificationFactors): { trustScore: number; confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH'; verdict: 'VERIFIED' | 'PARTIALLY VERIFIED' | 'SUSPICIOUS' | 'REJECTED' } {
    // Weighted multi-factor Bayesian formula
    const weights = {
      sourceCredibility: 0.15,
      locationMatch: 0.20,
      timestampValidity: 0.15,
      weatherApiMatch: 0.15,
      nearbyReports: 0.10,
      visualEvidence: 0.10,
      satelliteCorrelation: 0.15,
    };

    const weightedScore = 
      factors.sourceCredibility * weights.sourceCredibility +
      factors.locationMatch * weights.locationMatch +
      factors.timestampValidity * weights.timestampValidity +
      factors.weatherApiMatch * weights.weatherApiMatch +
      factors.nearbyReports * weights.nearbyReports +
      factors.visualEvidence * weights.visualEvidence +
      factors.satelliteCorrelation * weights.satelliteCorrelation;

    const trustScore = Math.round(weightedScore);

    let confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
    let verdict: 'VERIFIED' | 'PARTIALLY VERIFIED' | 'SUSPICIOUS' | 'REJECTED' = 'VERIFIED';

    if (trustScore >= 85) {
      confidenceLevel = 'HIGH';
      verdict = 'VERIFIED';
    } else if (trustScore >= 70) {
      confidenceLevel = 'MEDIUM';
      verdict = 'PARTIALLY VERIFIED';
    } else if (trustScore >= 40) {
      confidenceLevel = 'LOW';
      verdict = 'SUSPICIOUS';
    } else {
      confidenceLevel = 'HIGH';
      verdict = 'REJECTED';
    }

    return { trustScore, confidenceLevel, verdict };
  },

  async getVisualEvidence(): Promise<ImageVerificationResult[]> {
    try {
      const obs = await apiClient.get<any[]>('/api/v1/observations?has_media=true');
      if (!obs) return [];
      
      return obs.filter((o: any) => o.media_url).map((o: any) => {
        let evidenceJson = {
          supporting: [],
          contradicting: [],
          assessment: 'UNVERIFIED',
          reason: 'No detailed AI notes available.',
          image_analyzed: false
        };
        try {
          if (o.gemini_evidence_json) {
            evidenceJson = JSON.parse(o.gemini_evidence_json);
          }
        } catch(e) {}
        
        const isAuthentic = o.trust_score >= 80;
        
        return {
          id: o.id,
          fileName: o.id,
          detectedEvent: o.ml_event_type || o.event_type,
          aiConfidence: Math.round(o.ml_confidence ? o.ml_confidence * 100 : 0),
          authenticityScore: Math.round(o.trust_score || 0),
          tamperRisk: isAuthentic ? 'LOW' : 'HIGH',
          status: isAuthentic ? 'HIGHLY LIKELY AUTHENTIC' : 'SUSPICIOUS',
          url: o.media_url,
          title: `${o.city || 'Unknown Location'} ${o.event_type}`,
          explanation: evidenceJson.reason || evidenceJson.supporting?.join(', ') || 'AI processed visual forensics.',
          evidenceJson
        };
      });
    } catch (e) {
      console.error('Failed to get visual evidence:', e);
      return [];
    }
  },

  async verifyImage(presetOrFile: string): Promise<ImageVerificationResult> {
    // Legacy fallback or processing endpoint can go here if needed
    // But getVisualEvidence replaces the static array.
    throw new Error("verifyImage is deprecated. Use getVisualEvidence instead.");
  }
};
