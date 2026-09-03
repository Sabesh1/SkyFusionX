import React, { useEffect, useState } from 'react';
import { predictionApi } from '../services/predictionApi';
import { ShortTermPrediction, ContributingFactor } from '../types/prediction';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { PredictionTimelineChart } from '../components/prediction/PredictionTimelineChart';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  TriangleAlert,
  LineChart,
  CloudRain,
  Waves,
  Wind,
  Eye,
  Sparkles,
  Activity,
} from 'lucide-react';

export const PredictionsPage: React.FC = () => {
  const [predictions, setPredictions] = useState<ShortTermPrediction[]>([]);
  const [activePred, setActivePred] = useState<ShortTermPrediction | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await predictionApi.getPredictions();
      setPredictions(data);
      setActivePred(data[0]);
    };
    fetchData();
  }, []);

  if (!activePred) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumbs
        title="AI Predictive Risk Intelligence"
        description="Hydrodynamic deep-learning models forecasting next 1-3 hour localized flood risks, rainfall rates, and drainage breach probabilities across Indian metropolitan basins."
      />

      {/* Hero Prediction Card (Top Primary Focus) */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#121620] border border-red-500/30 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold uppercase">
                {activePred.timeframe}
              </span>
              <SeverityBadge severity={activePred.severity} size="sm" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-100 flex items-center gap-2">
              <TriangleAlert className="w-6 h-6 text-red-400 shrink-0" />
              {activePred.primaryRiskTitle} — {activePred.location}
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Peak Escalation Window: <strong className="text-cyan-400 font-mono">{activePred.peakTime}</strong>
            </p>
          </div>

          <div className="px-6 py-4 rounded-2xl bg-[#0B0E14] border border-red-500/40 text-center font-mono">
            <div className="text-3xl sm:text-4xl font-bold text-red-400">{activePred.overallProbability}%</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Flood Risk Index</div>
          </div>
        </div>

        {/* 3 Compact Probability Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono font-medium">Heavy Rainfall Probability</span>
              <CloudRain className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400">
              {activePred.heavyRainProbability}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${activePred.heavyRainProbability}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0E14] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono font-medium">Urban Inundation Probability</span>
              <Waves className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-red-400">
              {activePred.floodProbability}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${activePred.floodProbability}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0E14] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono font-medium">Storm Wind Gust Index</span>
              <Wind className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {activePred.stormProbability}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${activePred.stormProbability}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Trend Curve Chart */}
      <div className="space-y-3">
        <PredictionTimelineChart prediction={activePred} />
      </div>
    </div>
  );
};
