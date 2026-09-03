import { VerificationFactors } from '../types/report';
import { WeatherEventType } from '../types/common';

export interface ImageVerificationResult {
  fileName: string;
  detectedEvent: WeatherEventType;
  aiConfidence: number;
  locationMatch: number;
  timestampMatch: number;
  weatherCorrelation: number;
  authenticityScore: number;
  tamperRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'HIGHLY LIKELY AUTHENTIC' | 'SUSPICIOUS' | 'LIKELY MANIPULATED';
  exifDetails: {
    hasExif: boolean;
    cameraModel?: string;
    gpsCoordinates?: string;
    captureTimestamp?: string;
    softwareUsed?: string;
  };
  cvDetections: {
    label: string;
    confidence: number;
    box: [number, number, number, number]; // [x, y, w, h] in percentages
  }[];
  explanation: string;
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

  async verifyImage(presetOrFile: string): Promise<ImageVerificationResult> {
    // Pre-loaded realistic scenarios
    if (presetOrFile.includes('delhi') || presetOrFile.includes('dust')) {
      return {
        fileName: 'delhi_expressway_dust.jpg',
        detectedEvent: 'Dust Storm',
        aiConfidence: 89,
        locationMatch: 92,
        timestampMatch: 95,
        weatherCorrelation: 88,
        authenticityScore: 91,
        tamperRisk: 'LOW',
        status: 'HIGHLY LIKELY AUTHENTIC',
        exifDetails: {
          hasExif: true,
          cameraModel: 'OnePlus 11 5G (Hasselblad)',
          gpsCoordinates: '28.5355° N, 77.3910° E (Noida Expwy)',
          captureTimestamp: '2026-08-27 08:50:12 IST',
          softwareUsed: 'Stock Camera v4.2.1 (No edits detected)',
        },
        cvDetections: [
          { label: 'Airborne Dust/Haze Plume', confidence: 94, box: [10, 10, 80, 50] },
          { label: 'Low Visibility Vehicle Headlights', confidence: 88, box: [25, 60, 50, 30] },
        ],
        explanation: 'Multi-spectral sensor analysis: Particulate optical thickness matches ground PM10 surge logged at Safdarjung station. Visual EXIF metadata matches claimed coordinate grid.',
      };
    }

    if (presetOrFile.includes('mumbai') || presetOrFile.includes('rail')) {
      return {
        fileName: 'kurla_railway_tracks.jpg',
        detectedEvent: 'Urban Flooding',
        aiConfidence: 95,
        locationMatch: 98,
        timestampMatch: 94,
        weatherCorrelation: 96,
        authenticityScore: 96,
        tamperRisk: 'LOW',
        status: 'HIGHLY LIKELY AUTHENTIC',
        exifDetails: {
          hasExif: true,
          cameraModel: 'iPhone 15 Pro',
          gpsCoordinates: '19.0657° N, 72.8794° E (Kurla Stn)',
          captureTimestamp: '2026-08-27 09:02:15 IST',
          softwareUsed: 'iOS 18.2 Camera (Authentic Sensor Raw)',
        },
        cvDetections: [
          { label: 'Submerged Railway Track', confidence: 97, box: [15, 40, 70, 50] },
          { label: 'Station Platform Water Margin', confidence: 92, box: [5, 20, 40, 40] },
        ],
        explanation: 'Water level estimation algorithm calculates 32cm depth above ballast gravel. AWS Santacruz rain gauge and high tide timetable firmly support ground conditions.',
      };
    }

    // Default: Chennai Flood scenario
    return {
      fileName: 'chennai_velachery_flood.jpg',
      detectedEvent: 'Urban Flooding',
      aiConfidence: 94,
      locationMatch: 96,
      timestampMatch: 98,
      weatherCorrelation: 92,
      authenticityScore: 94,
      tamperRisk: 'LOW',
      status: 'HIGHLY LIKELY AUTHENTIC',
      exifDetails: {
        hasExif: true,
        cameraModel: 'Samsung Galaxy S24 Ultra',
        gpsCoordinates: '12.9815° N, 80.2180° E (Velachery 100ft Rd)',
        captureTimestamp: '2026-08-27 09:38:22 IST',
        softwareUsed: 'Samsung Camera Engine (Authentic metadata)',
      },
      cvDetections: [
        { label: 'Submerged Road Surface & Flow', confidence: 96, box: [10, 35, 80, 55] },
        { label: 'Half-Submerged Vehicle Wheel Arches', confidence: 93, box: [40, 45, 35, 40] },
        { label: 'Turbid Floodwater Current', confidence: 91, box: [20, 60, 60, 35] },
      ],
      explanation: 'Computer vision segmented standing flood water with 96% confidence. EXIF coordinates match Velachery arterial road. Nearby IMD Meenambakkam AWS records 62.4mm/hr rainfall.',
    };
  }
};
