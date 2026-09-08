import { ClusterDetail } from '../types/cluster';
import { apiClient } from './apiClient';

export const clusteringApi = {
  async getEventClusters(): Promise<ClusterDetail[]> {
    try {
      const clusters = await apiClient.get<ClusterDetail[]>('/api/v1/events/clusters');
      return clusters || [];
    } catch (e) {
      console.error('Failed to fetch event clusters:', e);
      return [];
    }
  },

  async getClusterById(id: string): Promise<ClusterDetail | null> {
    const clusters = await this.getEventClusters();
    return clusters.find(c => c.id === id) || null;
  }
};
