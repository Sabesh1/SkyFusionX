export interface RawReportClusterItem {
  id: string;
  lat: number;
  lng: number;
  text: string;
  source: string;
  timeOffset: string;
  confidence: number;
}

export interface ClusterDetail {
  id: string;
  clusterName: string;
  location: string;
  state: string;
  rawReportCount: number;
  deduplicatedEventsCount: number;
  duplicateReductionPct: number;
  clusterRadiusKm: number;
  activeWindowMinutes: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  trustScore: number;
  sourceDistribution: {
    citizen: number;
    social: number;
    official: number;
    sensor: number;
  };
  sampleReports: RawReportClusterItem[];
}

export const MOCK_CLUSTERS: ClusterDetail[] = [
  {
    id: 'CLUST-TN-CHE',
    clusterName: 'Chennai Flash Flood Cluster #1',
    location: 'Chennai South & Central Catchment',
    state: 'Tamil Nadu',
    rawReportCount: 1248,
    deduplicatedEventsCount: 1,
    duplicateReductionPct: 99.4,
    clusterRadiusKm: 28,
    activeWindowMinutes: 180,
    severity: 'CRITICAL',
    trustScore: 94,
    sourceDistribution: {
      citizen: 64,
      social: 22,
      official: 8,
      sensor: 6,
    },
    sampleReports: [
      { id: 'R-1', lat: 12.9815, lng: 80.2180, text: 'Velachery 100ft road inundated waist-deep', source: 'Citizen App', timeOffset: '2m ago', confidence: 96 },
      { id: 'R-2', lat: 12.9750, lng: 80.2210, text: 'Madipakkam main junction submerged, bus stranded', source: 'Twitter/X', timeOffset: '4m ago', confidence: 88 },
      { id: 'R-3', lat: 12.9249, lng: 80.1000, text: 'Tambaram GST road underpass flooded', source: 'Citizen App', timeOffset: '6m ago', confidence: 94 },
      { id: 'R-4', lat: 13.0418, lng: 80.2341, text: 'T. Nagar Bazullah road water stagnant', source: 'Citizen App', timeOffset: '9m ago', confidence: 91 },
      { id: 'R-5', lat: 13.0067, lng: 80.2573, text: 'Adyar river overflowing near Kotturpuram bridge', source: 'Official Drone', timeOffset: '12m ago', confidence: 98 },
    ]
  },
  {
    id: 'CLUST-TS-HYD',
    clusterName: 'Hyderabad Drainage Inflow Cluster',
    location: 'Hyderabad IT & Commercial Corridor',
    state: 'Telangana',
    rawReportCount: 580,
    deduplicatedEventsCount: 1,
    duplicateReductionPct: 98.8,
    clusterRadiusKm: 18,
    activeWindowMinutes: 120,
    severity: 'HIGH',
    trustScore: 87,
    sourceDistribution: {
      citizen: 58,
      social: 28,
      official: 10,
      sensor: 4,
    },
    sampleReports: [
      { id: 'R-HYD-1', lat: 17.4447, lng: 78.4664, text: 'Begumpet flyover underpass full of water', source: 'Citizen App', timeOffset: '3m ago', confidence: 90 },
      { id: 'R-HYD-2', lat: 17.4947, lng: 78.3996, text: 'Kukatpally Y junction heavy ponding', source: 'Twitter/X', timeOffset: '8m ago', confidence: 84 },
    ]
  },
  {
    id: 'CLUST-MH-MUM',
    clusterName: 'Mumbai Sub-Basin & Rail Corridor Cluster',
    location: 'Greater Mumbai Central Line',
    state: 'Maharashtra',
    rawReportCount: 890,
    deduplicatedEventsCount: 1,
    duplicateReductionPct: 99.1,
    clusterRadiusKm: 24,
    activeWindowMinutes: 150,
    severity: 'HIGH',
    trustScore: 91,
    sourceDistribution: {
      citizen: 60,
      social: 26,
      official: 9,
      sensor: 5,
    },
    sampleReports: [
      { id: 'R-MUM-1', lat: 19.0657, lng: 72.8794, text: 'Kurla tracks submerged, trains stationary', source: 'Citizen App', timeOffset: '4m ago', confidence: 95 },
      { id: 'R-MUM-2', lat: 19.0178, lng: 72.8478, text: 'Dadar TT circle water level 1.5 ft', source: 'Social Media', timeOffset: '7m ago', confidence: 89 },
    ]
  }
];
