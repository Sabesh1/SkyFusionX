import { GeoCoordinate, SeverityLevel } from '../types/common';

export interface IndianStateRisk {
  code: string;
  name: string;
  center: GeoCoordinate;
  riskLevel: SeverityLevel;
  activeEventsCount: number;
  totalReports: number;
  avgTrustScore: number;
  rainfallPast24hMm: number;
  criticalZonesCount: number;
  primaryRisk: string;
  districts: string[];
}

export const INDIAN_STATES_DATA: Record<string, IndianStateRisk> = {
  TN: {
    code: 'TN',
    name: 'Tamil Nadu',
    center: { lat: 13.0827, lng: 80.2707 },
    riskLevel: 'CRITICAL',
    activeEventsCount: 8,
    totalReports: 3420,
    avgTrustScore: 92,
    rainfallPast24hMm: 184.5,
    criticalZonesCount: 4,
    primaryRisk: 'Flash Flooding & Heavy Rainfall',
    districts: ['Chennai', 'Chengalpattu', 'Kanchipuram', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Cuddalore']
  },
  TS: {
    code: 'TS',
    name: 'Telangana',
    center: { lat: 17.3850, lng: 78.4867 },
    riskLevel: 'HIGH',
    activeEventsCount: 5,
    totalReports: 1890,
    avgTrustScore: 88,
    rainfallPast24hMm: 112.0,
    criticalZonesCount: 2,
    primaryRisk: 'Urban Inundation & Sump Overflows',
    districts: ['Hyderabad', 'Rangareddy', 'Warangal', 'Nizamabad', 'Karimnagar']
  },
  KA: {
    code: 'KA',
    name: 'Karnataka',
    center: { lat: 12.9716, lng: 77.5946 },
    riskLevel: 'MODERATE',
    activeEventsCount: 4,
    totalReports: 1420,
    avgTrustScore: 84,
    rainfallPast24hMm: 68.2,
    criticalZonesCount: 1,
    primaryRisk: 'Severe Thunderstorm & Tree Falls',
    districts: ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi']
  },
  MH: {
    code: 'MH',
    name: 'Maharashtra',
    center: { lat: 19.0760, lng: 72.8777 },
    riskLevel: 'HIGH',
    activeEventsCount: 6,
    totalReports: 2450,
    avgTrustScore: 89,
    rainfallPast24hMm: 142.8,
    criticalZonesCount: 3,
    primaryRisk: 'Suburban Track Waterlogging & Coastal Swell',
    districts: ['Mumbai', 'Thane', 'Palghar', 'Pune', 'Raigad', 'Nagpur', 'Nashik']
  },
  KL: {
    code: 'KL',
    name: 'Kerala',
    center: { lat: 9.9312, lng: 76.2673 },
    riskLevel: 'HIGH',
    activeEventsCount: 4,
    totalReports: 1120,
    avgTrustScore: 87,
    rainfallPast24hMm: 135.0,
    criticalZonesCount: 2,
    primaryRisk: 'Ghat Landslide Warning & Heavy Downpour',
    districts: ['Ernakulam', 'Wayanad', 'Idukki', 'Kozhikode', 'Thiruvananthapuram', 'Palakkad']
  },
  DL: {
    code: 'DL',
    name: 'Delhi NCR',
    center: { lat: 28.6139, lng: 77.2090 },
    riskLevel: 'MODERATE',
    activeEventsCount: 3,
    totalReports: 890,
    avgTrustScore: 81,
    rainfallPast24hMm: 12.0,
    criticalZonesCount: 0,
    primaryRisk: 'Squall, Dense Smog & High Wind Gusts',
    districts: ['Central Delhi', 'South Delhi', 'Noida', 'Gurugram', 'Ghaziabad']
  },
  WB: {
    code: 'WB',
    name: 'West Bengal',
    center: { lat: 22.5726, lng: 88.3639 },
    riskLevel: 'MODERATE',
    activeEventsCount: 3,
    totalReports: 780,
    avgTrustScore: 83,
    rainfallPast24hMm: 54.0,
    criticalZonesCount: 1,
    primaryRisk: 'Bay Depression & Gangetic Squalls',
    districts: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Siliguri']
  },
  OD: {
    code: 'OD',
    name: 'Odisha',
    center: { lat: 20.2961, lng: 85.8245 },
    riskLevel: 'HIGH',
    activeEventsCount: 4,
    totalReports: 950,
    avgTrustScore: 86,
    rainfallPast24hMm: 98.4,
    criticalZonesCount: 2,
    primaryRisk: 'Deep Depression Coastal Surge',
    districts: ['Bhubaneswar', 'Puri', 'Cuttack', 'Balasore', 'Ganjam']
  },
  GJ: {
    code: 'GJ',
    name: 'Gujarat',
    center: { lat: 23.0225, lng: 72.5714 },
    riskLevel: 'LOW',
    activeEventsCount: 1,
    totalReports: 320,
    avgTrustScore: 79,
    rainfallPast24hMm: 8.5,
    criticalZonesCount: 0,
    primaryRisk: 'Isolated Light Rain & Heat Index',
    districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Kutch']
  },
  RJ: {
    code: 'RJ',
    name: 'Rajasthan',
    center: { lat: 26.9124, lng: 75.7873 },
    riskLevel: 'LOW',
    activeEventsCount: 1,
    totalReports: 210,
    avgTrustScore: 78,
    rainfallPast24hMm: 2.1,
    criticalZonesCount: 0,
    primaryRisk: 'Dust Storm Gusts & Dry Heat',
    districts: ['Jaipur', 'Jodhpur', 'Udaipur', 'Bikaner', 'Kota']
  },
  AS: {
    code: 'AS',
    name: 'Assam',
    center: { lat: 26.1445, lng: 91.7362 },
    riskLevel: 'HIGH',
    activeEventsCount: 3,
    totalReports: 680,
    avgTrustScore: 85,
    rainfallPast24hMm: 120.5,
    criticalZonesCount: 1,
    primaryRisk: 'Brahmaputra Basin Water Rise',
    districts: ['Guwahati', 'Kamrup', 'Dibrugarh', 'Silchar', 'Jorhat']
  },
  BR: {
    code: 'BR',
    name: 'Bihar',
    center: { lat: 25.5941, lng: 85.1376 },
    riskLevel: 'LOW',
    activeEventsCount: 1,
    totalReports: 290,
    avgTrustScore: 76,
    rainfallPast24hMm: 18.0,
    criticalZonesCount: 0,
    primaryRisk: 'Localized Thunderstorms',
    districts: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur']
  }
};
