import { GeoCoordinate, SeverityLevel, SourceType, VerificationStatus, WeatherEventType } from './common';

export interface VerificationFactors {
  sourceCredibility: number; // 0-100
  locationMatch: number;      // 0-100
  timestampValidity: number;  // 0-100
  weatherApiMatch: number;    // 0-100
  nearbyReports: number;      // 0-100
  visualEvidence: number;     // 0-100
  satelliteCorrelation: number; // 0-100
}

export interface WeatherEvidence {
  type: 'image' | 'video' | 'sensor_log' | 'radar_echo';
  url: string;
  previewUrl?: string;
  capturedAt: string;
  exifLocation?: GeoCoordinate;
  hasExifData: boolean;
  tamperScore?: number; // 0-100 (higher means authentic)
  cvDetectedEvent?: WeatherEventType;
  cvConfidence?: number;
}

export interface WeatherReport {
  id: string;
  title: string;
  text: string;
  locationName: string;
  district: string;
  state: string;
  coordinates: GeoCoordinate;
  event: WeatherEventType;
  source: SourceType;
  sourceHandle?: string;
  sourceReputation: number; // 0-100
  trustScore: number;       // 0-100
  status: VerificationStatus;
  severity: SeverityLevel;
  timestamp: string;
  evidence?: WeatherEvidence[];
  verificationFactors: VerificationFactors;
  aiExplanation: string;
  mlEventType?: string;
  mlConfidence?: number;
  verificationRecommendation?: string;
  matchedStationId?: string;
  matchedStationDistanceKm?: number;
  matchedStationRainfallMm?: number;
  clusterId?: string;
  duplicateCount?: number;
  
  // Phase 5 Location Intelligence
  resolvedCity?: string;
  resolvedState?: string;
  locationConfidence?: number;
  
  // Phase 5 Duplicate Detection
  isDuplicate?: boolean;
  duplicateGroupId?: string;
  duplicateSimilarity?: number;
  duplicateOfId?: string;
}
