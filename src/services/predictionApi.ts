import { ShortTermPrediction } from '../types/prediction';
import { apiClient } from './apiClient';

export const predictionApi = {
  async getPredictions(): Promise<ShortTermPrediction[]> {
    try {
      const predictions = await apiClient.get<ShortTermPrediction[]>('/api/v1/events/risk-predictions');
      return predictions || [];
    } catch (e) {
      console.error('Failed to fetch predictions:', e);
      return [];
    }
  },

  async getPredictionById(id: string): Promise<ShortTermPrediction | null> {
    const predictions = await this.getPredictions();
    return predictions.find(p => p.id === id) || null;
  }
};
