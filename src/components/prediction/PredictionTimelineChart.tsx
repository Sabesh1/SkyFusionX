import React from 'react';
import { ShortTermPrediction, PredictionPoint } from '../../types/prediction';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface PredictionTimelineChartProps {
  prediction: ShortTermPrediction;
}

export const PredictionTimelineChart: React.FC<PredictionTimelineChartProps> = ({ prediction }) => {
  const data = (prediction.dataPoints || []).map((item: PredictionPoint) => ({
    time: item.hourLabel || item.timeOffset,
    floodRisk: item.floodProbability,
    rainRate: item.rainProbability,
    windGust: item.windSpeedKmh,
  }));

  return (
    <div className="p-6 rounded-3xl bg-theme-card border border-theme-border/80 space-y-4 shadow-card-emboss">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border/80 pb-3">
        <div>
          <h4 className="text-sm font-bold font-mono text-theme-text-secondary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
            AI Hydrodynamic Rainfall & Flood Escalation Wave
          </h4>
          <p className="text-xs text-theme-muted font-sans mt-0.5">
            15-minute forecasting intervals across urban river and drainage catchments.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-full bg-theme-surface border border-theme-primary/40 text-theme-primary font-bold">
            91% Convergence
          </span>
        </div>
      </div>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              {/* Luxury Gold Wave Gradient Fill */}
              <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.45} />
                <stop offset="50%" stopColor="var(--theme-primary-hover)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--theme-secondary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--theme-secondary)" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="var(--theme-text-secondary)"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="var(--theme-text-secondary)"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
              domain={[0, 100]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--theme-surface)',
                borderColor: 'var(--theme-border)',
                borderRadius: '12px',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                color: 'var(--theme-text)',
              }}
            />

            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--theme-text)' }} />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="floodRisk"
              name="Inundation Risk (%)"
              stroke="var(--theme-primary)"
              strokeWidth={2}
              fill="url(#probGrad)"
              dot={{ r: 4, fill: 'var(--theme-primary)', stroke: 'var(--theme-surface)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--theme-text-secondary)', stroke: 'var(--theme-primary)', strokeWidth: 2 }}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="rainRate"
              name="Rainfall (mm/h)"
              stroke="var(--theme-secondary)"
              strokeWidth={2}
              fill="url(#rainGrad)"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-theme-muted pt-2 border-t border-theme-border/80">
        <span>Model: NeuralHydro-LSTM v3.4</span>
        <span className="text-theme-primary">Peak Inundation Window: {prediction.peakTime}</span>
      </div>
    </div>
  );
};
