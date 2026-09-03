import React, { useEffect, useState } from 'react';
import { fusionApi } from '../services/fusionApi';
import { DataSourceHealth, EventFusionBreakdown } from '../types/fusion';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { FusionPipelineGraphic } from '../components/fusion/FusionPipelineGraphic';
import { DataSourceStatusCard } from '../components/fusion/DataSourceStatusCard';
import { Layers, Activity, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const DataFusionPage: React.FC = () => {
  const [sources, setSources] = useState<DataSourceHealth[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('EVT-TN-01');
  const [fusionBreakdown, setFusionBreakdown] = useState<EventFusionBreakdown | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const srcData = await fusionApi.getDataSourceHealth();
      setSources(srcData);
      const fusionData = await fusionApi.getEventFusionBreakdown(selectedEventId);
      setFusionBreakdown(fusionData);
    };
    fetchData();
  }, [selectedEventId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <Breadcrumbs
        title="Multi-Source Data Fusion"
        description="Unified real-time data synthesis merging orbital satellites, ground Doppler radars, 1,284 AWS stations, numerical weather models, and citizen ground pings into high-confidence intelligence."
      />

      {/* Visual Data Fusion Graphic */}
      <FusionPipelineGraphic />

      {/* Flagship Event Multi-Sensor Convergence Meter */}
      {fusionBreakdown && (
        <div className="p-6 rounded-2xl bg-command-card border border-cyan-500/40 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase">
                  Multi-Modal Convergence Meter
                </span>
                <span className="font-mono text-xs text-slate-400">{fusionBreakdown.eventId}</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-display mt-1">
                {fusionBreakdown.eventName} ({fusionBreakdown.location})
              </h3>
            </div>

            {/* Event Selector Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'EVT-TN-01', name: 'Chennai Heavy Rain' },
                { id: 'EVT-TS-01', name: 'Hyderabad Flood' },
                { id: 'EVT-KA-01', name: 'Bengaluru Thunderstorm' },
              ].map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    selectedEventId === ev.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ev.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Fusion Confidence Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left 4 Cols: Big Confidence Gauge */}
            <div className="md:col-span-4 p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Overall Fusion Confidence
              </span>
              <div className="text-5xl font-extrabold font-mono text-cyan-400">
                {fusionBreakdown.overallFusionConfidence}%
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                CONVERGED
              </div>
            </div>

            {/* Right 8 Cols: Specific Pipeline Correlations */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Citizen Reports</span>
                <div className="text-lg font-bold text-slate-100">{fusionBreakdown.citizenReportCount} Ground Pings</div>
                <div className="text-[10px] text-cyan-400">100% Geo-Triangulated</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Weather Stations</span>
                <div className="text-lg font-bold text-emerald-400">{fusionBreakdown.weatherStationCount} Active AWS</div>
                <div className="text-[10px] text-slate-400">Rain &gt; 50mm/hr</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Satellite Match</span>
                <div className="text-lg font-bold text-blue-400">{fusionBreakdown.satelliteCorrelationPct}%</div>
                <div className="text-[10px] text-slate-400">INSAT-3D Infrared</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Doppler Radar</span>
                <div className="text-lg font-bold text-purple-400">{fusionBreakdown.radarCorrelationPct}%</div>
                <div className="text-[10px] text-slate-400">54 dBZ Core Reflectivity</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Weather APIs</span>
                <div className="text-lg font-bold text-amber-400">{fusionBreakdown.apiCorrelationPct}%</div>
                <div className="text-[10px] text-slate-400">IMD NWP Models</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Social Signals</span>
                <div className="text-lg font-bold text-pink-400">{fusionBreakdown.socialSignalsScorePct}%</div>
                <div className="text-[10px] text-slate-400">NLP Keyword Surges</div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300">
            <span className="font-mono text-cyan-400 font-bold uppercase mr-1.5">Fusion Synthesis:</span>
            {fusionBreakdown.fusionVerdict}
          </div>
        </div>
      )}

      {/* 6 Real-Time Data Source Health Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-400">
          6 Live Telemetry Pipelines (Status & Diagnostics)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map(source => (
            <DataSourceStatusCard key={source.id} source={source} />
          ))}
        </div>
      </div>
    </div>
  );
};
