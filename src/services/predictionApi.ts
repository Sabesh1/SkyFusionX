import { MOCK_PREDICTIONS } from '../data/mockPredictions';
import { ShortTermPrediction } from '../types/prediction';

export const predictionApi = {
  async getPredictions(): Promise<ShortTermPrediction[]> {
    return MOCK_PREDICTIONS;
  },

  async getPredictionById(id: string): Promise<ShortTermPrediction | null> {
    return MOCK_PREDICTIONS.find(p => p.id === id) || MOCK_PREDICTIONS[0];
  }
};
