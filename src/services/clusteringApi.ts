import { ClusterDetail, MOCK_CLUSTERS } from '../data/mockClustering';

export const clusteringApi = {
  async getEventClusters(): Promise<ClusterDetail[]> {
    return MOCK_CLUSTERS;
  },

  async getClusterById(id: string): Promise<ClusterDetail | null> {
    return MOCK_CLUSTERS.find(c => c.id === id) || MOCK_CLUSTERS[0];
  }
};
