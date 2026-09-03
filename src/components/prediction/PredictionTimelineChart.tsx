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
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#1C1C24] to-[#131318] border border-[#2B2B3C] space-y-4 shadow-card-emboss">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#252534] pb-3">
        <div>
          <h4 className="text-sm font-bold font-mono text-[#F3D9B5] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E5A962] animate-pulse" />
            AI Hydrodynamic Rainfall & Flood Escalation Wave
          </h4>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            15-minute forecasting intervals across urban river and drainage catchments.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-full bg-[#292218] border border-[#E5A962]/40 text-[#E5A962] font-bold">
            91% Convergence
          </span>
        </div>
      </div>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              {/* Luxury Gold Wave Gradient Fill */}
              <linearGradient id="goldWaveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E5A962" stopOpacity={0.45} />
                <stop offset="50%" stopColor="#D49547" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#8C5E28" stopOpacity={0.0} />
              </linearGradient>

              {/* Rain Intensity Wave */}
              <linearGradient id="rainWaveFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#22222E" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#68687C"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
            />
            <YAxis
              stroke="#68687C"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
              domain={[0, 100]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#16161E',
                borderColor: '#E5A962',
                borderRadius: '16px',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                color: '#EEEEF2',
              }}
            />

            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono' }} />

            <Area
              type="monotone"
              dataKey="floodRisk"
              name="Flood Risk Index (%)"
              stroke="#E5A962"
              strokeWidth={3}
              fill="url(#goldWaveFill)"
              dot={{ r: 4, fill: '#E5A962', stroke: '#121217', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#F3D9B5', stroke: '#E5A962', strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="rainRate"
              name="Rainfall Probability (%)"
              stroke="#38BDF8"
              strokeWidth={2}
              fill="url(#rainWaveFill)"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-[#252534]">
        <span>Model: NeuralHydro-LSTM v3.4</span>
        <span className="text-[#E5A962]">Peak Inundation Window: {prediction.peakTime}</span>
      </div>
    </div>
  );
};
