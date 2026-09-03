import { SeverityLevel, WeatherEventType } from './common';

export interface PredictionPoint {
  timeOffset: string; // "Current", "+1 Hour", "+2 Hours", "+3 Hours", "+6 Hours"
  hourLabel: string;
  rainProbability: number;
  floodProbability: number;
  stormProbability: number;
  windSpeedKmh: number;
  waterLevelRiskIndex: number;
  visibilityRiskIndex: number;
}

export interface ContributingFactor {
  factor: string;
  weight: number; // 0-100
  trend: 'increasing' | 'stable' | 'decreasing';
  currentValue: string;
  source: string;
  confidence: number;
}

export interface ShortTermPrediction {
  id: string;
  location: string;
  state: string;
  primaryRiskTitle: string;
  primaryRiskType: WeatherEventType;
  severity: SeverityLevel;
  timeframe: string; // e.g. "Next 3 Hours"
  peakTime: string;
  overallProbability: number;
  heavyRainProbability: number;
  floodProbability: number;
  stormProbability: number;
  visibilityRiskProbability: number;
  dataPoints: PredictionPoint[];
  contributingFactors: ContributingFactor[];
  aiNotes: string;
  isGuaranteedForecast: false;
}
