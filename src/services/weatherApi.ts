import { INDIAN_STATES_DATA, IndianStateRisk } from '../data/indiaGeoData';
import { KpiMetric } from '../types/common';
import { apiClient } from './apiClient';

export interface DashboardStats {
  totalReports: KpiMetric;
  aiVerified: KpiMetric;
  activeEvents: KpiMetric;
  suspiciousReports: KpiMetric;
  criticalZones: KpiMetric;
  reportsLastHour: KpiMetric;
}

export const weatherApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const rawStats = await apiClient.get<any>('/api/v1/dashboard/stats');
    
    if (rawStats) {
      const total = rawStats.total_reports || 0;
      const verified = rawStats.verified_reports || 0;
      const verifiedPercent = total > 0 ? ((verified / total) * 100).toFixed(1) : '0.0';
      const rejected = rawStats.rejected_reports || 0;
      
      return {
        totalReports: {
          id: 'kpi-total',
          title: 'Total Reports',
          value: total,
          changePercent: 0,
          subtext: 'Database Synced',
          trend: 'neutral',
        },
        aiVerified: {
          id: 'kpi-verified',
          title: 'AI Verified',
          value: `${verified} (${verifiedPercent}%)`,
          changePercent: 0,
          subtext: 'Truth Engine Verified',
          trend: 'neutral',
        },
        activeEvents: {
          id: 'kpi-events',
          title: 'Active Weather Events',
          value: rawStats.total_events || 0,
          changePercent: 0,
          subtext: 'Active DB Entries',
          trend: 'neutral',
        },
        suspiciousReports: {
          id: 'kpi-suspicious',
          title: 'Rejected Reports',
          value: rejected,
          changePercent: 0,
          subtext: 'Filtered by AI Truth Engine',
          trend: 'neutral',
        },
        criticalZones: {
          id: 'kpi-critical',
          title: 'Critical Zones',
          value: 0, // Could calculate based on severity distribution
          changePercent: 0,
          subtext: 'NDRF Alert Active',
          trend: 'neutral',
        },
        reportsLastHour: {
          id: 'kpi-hour',
          title: 'Pending Review',
          value: rawStats.pending_reports || 0,
          changePercent: 0,
          subtext: 'Awaiting Admin Action',
          trend: 'neutral',
        },
      };
    }
    
    // Fallback if backend is unreachable
    return {
      totalReports: {
        id: 'kpi-total',
        title: 'Total Reports',
        value: 0,
        changePercent: 0,
        subtext: 'Backend Offline',
        trend: 'neutral',
      },
      aiVerified: {
        id: 'kpi-verified',
        title: 'AI Verified',
        value: '0 (0%)',
        changePercent: 0,
        subtext: 'Backend Offline',
        trend: 'neutral',
      },
      activeEvents: {
        id: 'kpi-events',
        title: 'Active Weather Events',
        value: 0,
        changePercent: 0,
        subtext: 'Backend Offline',
        trend: 'neutral',
      },
      suspiciousReports: {
        id: 'kpi-suspicious',
        title: 'Suspicious Reports',
        value: 0,
        changePercent: 0,
        subtext: 'Backend Offline',
        trend: 'neutral',
      },
      criticalZones: {
        id: 'kpi-critical',
        title: 'Critical Zones',
        value: 0,
        changePercent: 0,
        subtext: 'Backend Offline',
        trend: 'neutral',
      },
      reportsLastHour: {
        id: 'kpi-hour',
        title: 'Reports in Last Hour',
        value: 0,
        changePercent: 0,
        subtext: 'Backend Offline',
        trend: 'neutral',
      },
    };
  },

  async getRiskMapData(): Promise<Record<string, IndianStateRisk>> {
    return INDIAN_STATES_DATA;
  },

  async getStateRisk(code: string): Promise<IndianStateRisk | null> {
    return INDIAN_STATES_DATA[code] || null;
  }
};
