import React from 'react';
import {
  Satellite,
  Radio,
  Users,
  CloudLightning,
  Database,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const FusionPipelineGraphic: React.FC = () => {
  const sources = [
    { name: 'INSAT-3D Satellite', icon: Satellite, color: 'text-blue-400', stat: 'Cloud Temp -74°C' },
    { name: '1,284 AWS Stations', icon: Radio, color: 'text-emerald-400', stat: '62.4mm/hr Rain' },
    { name: 'Doppler Radar', icon: CloudLightning, color: 'text-purple-400', stat: '54 dBZ Reflectivity' },
    { name: 'Citizen Reports', icon: Users, color: 'text-cyan-400', stat: '423 Ground Pings' },
    { name: 'NWP Weather APIs', icon: Database, color: 'text-amber-400', stat: 'IMD + ECMWF 94%' },
    { name: 'Social NLP Signals', icon: Zap, color: 'text-pink-400', stat: 'Filtered Geo-Tags' },
  ];

  return (
    <div className="p-6 rounded-2xl bg-command-card border border-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-mono uppercase font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Live Multi-Modal Sensor Fusion Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ingestion and normalization across 6 diverse telemetry streams.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-mono text-xs font-bold">
          LATENCY: 42ms
        </span>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Step 1: 6 Ingestion Streams */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold px-1">
            1. Raw Telemetry Ingest
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sources.map(src => (
              <div
                key={src.name}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <src.icon className={`w-3.5 h-3.5 ${src.color}`} />
                  <span className="text-[11px] font-medium text-slate-200 truncate">{src.name.split(' ')[0]}</span>
                </div>
                <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{src.stat}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Normalization Layer */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2 relative group hover:border-cyan-500/40 transition-all">
          <div className="p-2.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">2. Pre-Processing</span>
            <h4 className="text-xs font-bold text-slate-200">Data Normalization</h4>
            <p className="text-[10px] text-slate-400">Geo-polygon snapping & timestamp synchronization</p>
          </div>
        </div>

        {/* Step 3: AI Fusion Engine */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/30 to-blue-950/30 border border-cyan-500/50 flex flex-col items-center justify-center text-center space-y-2 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="p-2.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 animate-pulse">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">3. Multi-Modal Core</span>
            <h4 className="text-xs font-bold text-slate-100">AI Fusion Engine</h4>
            <p className="text-[10px] text-cyan-300 font-mono">Bayesian Weight Matrix</p>
          </div>
        </div>

        {/* Step 4: Verified Weather Event Output */}
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-2.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">4. Actionable Incident</span>
            <h4 className="text-xs font-bold text-slate-100">Verified Weather Event</h4>
            <p className="text-[10px] font-mono text-emerald-300">93% Fusion Confidence</p>
          </div>
        </div>
      </div>
    </div>
  );
};
