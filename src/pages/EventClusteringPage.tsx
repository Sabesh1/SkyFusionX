import React, { useEffect, useState } from 'react';
import { clusteringApi } from '../services/clusteringApi';
import { ClusterDetail } from '../data/mockClustering';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { ClusterDeduplicationStat } from '../components/clustering/ClusterDeduplicationStat';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  MapPin,
  Clock,
  ArrowRight,
  Users,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EventClusteringPage: React.FC = () => {
  const [clusters, setClusters] = useState<ClusterDetail[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ClusterDetail | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClusters = async () => {
      const data = await clusteringApi.getEventClusters();
      setClusters(data);
      setSelectedCluster(data[0]);
    };
    fetchClusters();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumbs
        title="AI Spatio-Temporal Event Clustering"
        description="DBSCAN and Spatio-Temporal K-Nearest Neighbor algorithms aggregate thousands of fragmented citizen pings into unified disaster events while eliminating redundant noise."
      />

      {/* Flagship Deduplication KPI Showcase */}
      {selectedCluster && <ClusterDeduplicationStat cluster={selectedCluster} />}

      {/* Clustered Event Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase font-bold text-slate-400">
            Active Regional Disaster Clusters ({clusters.length})
          </h3>
          <span className="text-xs font-mono text-cyan-400">
            Average 99.2% Noise Reduction
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map(cl => (
            <div
              key={cl.id}
              onClick={() => setSelectedCluster(cl)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm space-y-4 ${
                selectedCluster?.id === cl.id
                  ? 'bg-[#141926] border-cyan-500/60 ring-1 ring-cyan-500/30'
                  : 'bg-[#121620] border-slate-800/80 hover:border-slate-700 hover:bg-[#161B28]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <SeverityBadge severity={cl.severity} size="sm" />
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {cl.trustScore}% Trust
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 font-sans">
                  {cl.clusterName}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 font-mono mt-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{cl.location}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cl.rawReportCount} Reports</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{cl.activeWindowMinutes}m window</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-semibold">{cl.duplicateReductionPct}% Noise Drop</span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    navigate('/events/EVT-TN-01');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
