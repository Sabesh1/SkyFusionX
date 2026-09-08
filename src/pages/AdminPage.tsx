import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import {
  Server,
  Cpu,
  Database,
  Satellite,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  ShieldAlert,
  Check,
  X,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../services/apiClient';
import { WeatherReport } from '../types/report';
export const AdminPage: React.FC = () => {
  const { addToast } = useApp();
  const [verifyThreshold, setVerifyThreshold] = useState(85);
  const [escalateThreshold, setEscalateThreshold] = useState(92);
  const [spamFilterSensitivity, setSpamFilterSensitivity] = useState(75);

  const [pendingReports, setPendingReports] = useState<WeatherReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingReports = async () => {
    setIsLoading(true);
    // Fetch reports that are UNVERIFIED or UNDER_REVIEW
    const [unverified, underReview] = await Promise.all([
      apiClient.get<WeatherReport[]>('/api/v1/observations?verification_status=UNVERIFIED'),
      apiClient.get<WeatherReport[]>('/api/v1/observations?verification_status=UNDER_REVIEW')
    ]);
    
    let combined: WeatherReport[] = [];
    if (unverified) combined = [...combined, ...unverified];
    if (underReview) combined = [...combined, ...underReview];
    
    // Sort by most recent first
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setPendingReports(combined);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPendingReports();
    // In a real app we'd use SSE here, but we can poll for now or just fetch once
    const interval = setInterval(fetchPendingReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    const res = await apiClient.patch(`/api/v1/observations/${id}`, {
      verification_status: status
    });
    
    if (res) {
      addToast({
        type: 'success',
        title: 'Report Updated',
        message: `Report has been marked as ${status}.`
      });
      // Remove from list
      setPendingReports(prev => prev.filter(r => r.id !== id));
    } else {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not update report status.'
      });
    }
  };

  const infrastructure = [
    { name: 'Apache Kafka Event Bus', type: 'Stream Broker', status: 'ONLINE', latency: '4ms', uptime: '99.99%', load: '14,200 msg/s' },
    { name: 'PostgreSQL PostGIS Spatial DB', type: 'Database', status: 'ONLINE', latency: '8ms', uptime: '99.98%', load: '4.2 GB / 250 GB' },
    { name: 'AI Truth Bayesian Inference Node', type: 'AI Microservice', status: 'ONLINE', latency: '18ms', uptime: '99.95%', load: '32% GPU Util' },
    { name: 'INSAT-3D ISRO Satellite Uplink', type: 'Orbital Telemetry', status: 'ONLINE', latency: '140ms', uptime: '99.94%', load: '4.2 MB/s Scan' },
    { name: 'Doppler Weather Radar Grid', type: 'DWR Telemetry', status: 'ONLINE', latency: '85ms', uptime: '99.89%', load: '34 Radars Live' },
    { name: 'IMD & ECMWF Weather API Gateway', type: 'External REST API', status: 'ONLINE', latency: '210ms', uptime: '99.92%', load: '3/3 Healthy' },
  ];

  const systemLogs = [
    { time: '09:48:12', level: 'INFO', msg: 'INSAT-3D rapid thermal scan complete. Cloud top temp -74°C in Sector TN-CHE.' },
    { time: '09:47:55', level: 'VERIFY', msg: 'Bayesian Truth Engine verified report REP-CHE-001 (Trust: 94%).' },
    { time: '09:47:30', level: 'CLUSTER', msg: 'DBSCAN spatio-temporal cluster EVT-TN-01 updated with 14 new citizen pings.' },
    { time: '09:46:18', level: 'ALERT', msg: 'CAP-v1.2 Emergency warning generated in Tamil & English for Chennai Metropolitan Area.' },
    { time: '09:45:00', level: 'WARN', msg: 'Quarantined suspicious claim REP-SUSP-001 (Marina Beach tsunami hoax, Trust: 12%).' },
  ];

  const handleSaveThresholds = () => {
    addToast({
      type: 'success',
      title: 'AI Thresholds Updated',
      message: `Verification threshold set to ${verifyThreshold}%, Escalation at ${escalateThreshold}%.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <Breadcrumbs
        title="System Health & Infrastructure Control"
        description="Core pipeline telemetry, Apache Kafka message brokers, PostGIS spatial clusters, and AI Bayesian verification threshold calibrations."
      />

      {/* Infrastructure Diagnostics Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase font-bold text-theme-muted flex items-center gap-1.5">
            <Server className="w-4 h-4 text-cyan-400" />
            Active Infrastructure Services (6/6 Healthy)
          </h3>
          <span className="text-xs font-mono text-emerald-400 font-bold">System Uptime: 99.98%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {infrastructure.map(item => (
            <div key={item.name} className="p-4 rounded-xl bg-theme-card border border-theme-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-theme-text font-mono">{item.name}</h4>
                  <span className="text-[10px] text-theme-muted font-mono">{item.type}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  {item.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-theme-border text-[10px] font-mono text-theme-muted">
                <div>
                  Latency: <span className="text-cyan-400 font-bold">{item.latency}</span>
                </div>
                <div>
                  Uptime: <span className="text-theme-text font-bold">{item.uptime}</span>
                </div>
                <div className="text-right">
                  <span className="text-theme-text">{item.load}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Calibration Sliders & Pipeline Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: Threshold Sliders */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-theme-card border border-theme-border space-y-6">
          <div className="flex items-center justify-between border-b border-theme-border pb-3">
            <h3 className="text-xs font-mono uppercase font-bold text-theme-text flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              AI Truth Verification Thresholds
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">Live Policy</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-theme-text">Auto-Verification Threshold:</span>
                <span className="text-emerald-400 font-bold">{verifyThreshold}% Trust</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={verifyThreshold}
                onChange={e => setVerifyThreshold(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-theme-card rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-theme-muted font-sans">
                Reports exceeding this score are automatically flagged as VERIFIED across dashboards.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-theme-text">NDRF Emergency Escalation Threshold:</span>
                <span className="text-red-400 font-bold">{escalateThreshold}% Trust</span>
              </div>
              <input
                type="range"
                min="75"
                max="99"
                value={escalateThreshold}
                onChange={e => setEscalateThreshold(Number(e.target.value))}
                className="w-full accent-red-400 h-1.5 bg-theme-card rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-theme-muted font-sans">
                Triggers Level-4 automated red alerts to municipal emergency operation centers.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-theme-text">Misinformation Quarantine Sensitivity:</span>
                <span className="text-amber-400 font-bold">{spamFilterSensitivity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={spamFilterSensitivity}
                onChange={e => setSpamFilterSensitivity(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-theme-card rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleSaveThresholds}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-md transition-all"
          >
            Apply & Broadcast Policy
          </button>
        </div>

        {/* Right 6 Cols: Live Pipeline Audit Logs */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-theme-card border border-theme-border space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-3">
            <h3 className="text-xs font-mono uppercase font-bold text-theme-text flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Kafka Real-Time Event Bus Logs
            </h3>
            <span className="text-[10px] font-mono text-theme-muted">Live Ticker</span>
          </div>

          <div className="p-4 rounded-xl bg-theme-bg border border-theme-border/80 font-mono text-[11px] space-y-2.5 max-h-[300px] overflow-y-auto">
            {systemLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-theme-muted shrink-0">{log.time}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                    log.level === 'VERIFY'
                      ? 'bg-emerald-950 text-emerald-400'
                      : log.level === 'ALERT'
                      ? 'bg-red-950 text-red-400'
                      : log.level === 'WARN'
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-cyan-950 text-cyan-400'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-theme-text">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Pending Reports Data Table */}
      <div className="p-6 rounded-2xl bg-theme-card border border-theme-border space-y-4">
        <div className="flex items-center justify-between border-b border-theme-border pb-3">
          <h3 className="text-sm font-mono uppercase font-bold text-theme-text flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Pending Reports requiring Admin Verification
          </h3>
          <span className="text-xs font-mono bg-amber-950 text-amber-400 px-2 py-1 rounded">
            {pendingReports.length} Pending
          </span>
        </div>

        {isLoading ? (
          <div className="text-theme-muted font-mono text-xs py-8 text-center animate-pulse">
            Fetching unverified reports...
          </div>
        ) : pendingReports.length === 0 ? (
          <div className="text-theme-muted font-mono text-xs py-8 text-center">
            No pending reports require human verification at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-theme-border text-theme-muted">
                  <th className="py-3 px-4 uppercase">Event / Source</th>
                  <th className="py-3 px-4 uppercase">Location</th>
                  <th className="py-3 px-4 uppercase">Content & Assessment</th>
                  <th className="py-3 px-4 uppercase">AI Trust</th>
                  <th className="py-3 px-4 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {pendingReports.map(report => (
                  <tr key={report.id} className="hover:bg-theme-surface/50 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-theme-text">{report.event}</div>
                      <div className="text-[10px] text-theme-muted">{report.source}</div>
                      <div className="text-[10px] text-slate-600 mt-1">{new Date(report.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="text-theme-text">{report.city}</div>
                      <div className="text-[10px] text-theme-muted">{report.state}</div>
                    </td>
                    <td className="py-4 px-4 align-top max-w-[300px]">
                      <div className="text-theme-text line-clamp-2" title={report.text}>"{report.text}"</div>
                      {report.aiExplanation && (
                        <div className="mt-2 text-[10px] p-2 bg-theme-bg border border-theme-border rounded">
                          <span className="text-cyan-400 font-bold">AI Assessment: </span>
                          <span className="text-theme-muted">{report.aiExplanation}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className={`text-lg font-bold ${
                        report.trustScore >= verifyThreshold ? 'text-emerald-400' :
                        report.trustScore < 40 ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {report.trustScore}%
                      </div>
                      <div className="text-[10px] text-theme-muted">{report.status}</div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'VERIFIED')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'REJECTED')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-500/30 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
