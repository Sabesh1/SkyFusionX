import React from 'react';
import { DataSourceHealth } from '../../types/fusion';
import { Satellite, Radio, CloudRain, Database, Zap, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export const DataSourceStatusCard: React.FC<{ source: DataSourceHealth }> = ({ source }) => {
  const iconMap: Record<string, any> = {
    satellite: Satellite,
    stations: Radio,
    radar: CloudRain,
    apis: Database,
    social: Zap,
    citizen: Users,
  };

  const Icon = iconMap[source.type] || Radio;

  return (
    <div className="p-4 rounded-xl bg-command-card border border-slate-800 hover:border-slate-700 transition-all space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">{source.name}</h4>
            <span className="text-[10px] font-mono text-slate-400">{source.activeNodes}</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {source.status}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{source.description}</p>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
        <div>
          Throughput: <span className="text-slate-200 font-semibold">{source.throughputRate}</span>
        </div>
        <div>
          Reliability: <span className="text-emerald-400 font-semibold">{source.reliabilityScore}%</span>
        </div>
        <div>
          Latency: <span className="text-cyan-400 font-semibold">{source.latencyMs} ms</span>
        </div>
        <div>
          Latest Sync: <span className="text-slate-300">{source.latestSyncTime}</span>
        </div>
      </div>
    </div>
  );
};
