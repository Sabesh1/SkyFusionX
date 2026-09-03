import React from 'react';
import { Layers, ArrowRight, ShieldCheck, Sparkles, Filter } from 'lucide-react';
import { ClusterDetail } from '../../data/mockClustering';

export const ClusterDeduplicationStat: React.FC<{ cluster: ClusterDetail }> = ({ cluster }) => {
  return (
    <div className="p-6 rounded-2xl bg-command-card border border-cyan-500/30 space-y-6">
      {/* Visual Reduction Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-slate-900 via-[#0B1426] to-slate-900 border border-slate-800">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
              Spatio-Temporal Aggregation Ratio
            </div>
            <h3 className="text-xl font-bold text-slate-100 font-mono mt-0.5">
              {cluster.rawReportCount.toLocaleString()} Raw Signals &rarr; {cluster.deduplicatedEventsCount} Actionable Incident
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {cluster.duplicateReductionPct}%
            </div>
            <div className="text-[10px] font-mono text-emerald-300 uppercase">Noise Filtered</div>
          </div>
        </div>
      </div>

      {/* Cluster Metadata Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Cluster Radius</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5">{cluster.clusterRadiusKm} km</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Active Window</span>
          <p className="text-sm font-bold text-cyan-400 mt-0.5">{cluster.activeWindowMinutes} mins</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Confidence Score</span>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">{cluster.trustScore}% Trust</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">Algorithm</span>
          <p className="text-sm font-bold text-purple-400 mt-0.5">DBSCAN + ST-KNN</p>
        </div>
      </div>

      {/* Source Distribution Breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>Clustered Source Distribution</span>
          <span className="text-cyan-400">Multi-Modal Intake</span>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
          <div
            className="h-full bg-cyan-400"
            style={{ width: `${cluster.sourceDistribution.citizen}%` }}
            title={`Citizen App: ${cluster.sourceDistribution.citizen}%`}
          />
          <div
            className="h-full bg-blue-500"
            style={{ width: `${cluster.sourceDistribution.social}%` }}
            title={`Social Media: ${cluster.sourceDistribution.social}%`}
          />
          <div
            className="h-full bg-emerald-400"
            style={{ width: `${cluster.sourceDistribution.official}%` }}
            title={`Official Agencies: ${cluster.sourceDistribution.official}%`}
          />
          <div
            className="h-full bg-purple-400"
            style={{ width: `${cluster.sourceDistribution.sensor}%` }}
            title={`AWS Sensors: ${cluster.sourceDistribution.sensor}%`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            Citizen ({cluster.sourceDistribution.citizen}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Social ({cluster.sourceDistribution.social}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Official ({cluster.sourceDistribution.official}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            Sensor Array ({cluster.sourceDistribution.sensor}%)
          </span>
        </div>
      </div>
    </div>
  );
};
