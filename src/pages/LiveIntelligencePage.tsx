import React, { useEffect, useState } from 'react';
import { reportApi } from '../services/reportApi';
import { apiClient } from '../services/apiClient';
import { WeatherReport } from '../types/report';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { SeverityBadge, StatusBadge } from '../components/common/SeverityBadge';
import { useDemoMode } from '../context/DemoModeContext';
import { useApp } from '../context/AppContext';
import {
  Radio,
  Play,
  Pause,
  Filter,
  Search,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const LiveIntelligencePage: React.FC = () => {
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [isStreamPaused, setIsStreamPaused] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [aiStatus, setAiStatus] = useState<'Online' | 'Unavailable'>('Unavailable');
  const { liveReports } = useDemoMode();
  const { setSelectedReport } = useApp();

  useEffect(() => {
    const fetchInitial = async () => {
      const data = await reportApi.getLiveReports();
      setReports(data);
      
      try {
        const health = await apiClient.get<any>('/health');
        if (health && health.ml === 'loaded') {
          setAiStatus('Online');
        }
      } catch (e) {
        // Handle gracefully
      }
    };
    
    // Only fetch initial if we are starting up (e.g. not paused initially, or we just want to fetch once)
    // Actually, let's always fetch initial on mount, just not reconnect SSE if paused.
    fetchInitial();
    
    // Listen for manual submissions
    const handleSubmission = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = customEvent.detail;
      if (id) {
        // Fetch the specific report to ensure it maps consistently with ML fields.
        reportApi.getReportById(id).then(newReport => {
           if(newReport) {
              setReports(current => {
                 if (current.find(r => r.id === id)) return current;
                 return [newReport, ...current];
              });
           }
        });
      }
    };
    window.addEventListener('report_submitted', handleSubmission);
    
    return () => {
      window.removeEventListener('report_submitted', handleSubmission);
    };
  }, []); // Run once on mount

  useEffect(() => {
    if (isStreamPaused) return;

    // Setup SSE connection
    const evtSource = apiClient.createEventSource('/api/v1/events/stream');
    if (evtSource) {
      evtSource.addEventListener('weather_event_update', (e: any) => {
        try {
          const rawData = JSON.parse(e.data);
          // Only add to stream if not already present
          setReports(prev => {
            if (prev.find(r => r.id === rawData.event_id)) return prev;
            
            reportApi.getReportById(rawData.event_id).then(newReport => {
               if(newReport) {
                  setReports(current => [newReport, ...current]);
               }
            });
            return prev;
          });
        } catch (err) {
          console.error('Failed to parse stream event', err);
        }
      });

      return () => {
        evtSource.close();
      };
    }
  }, [isStreamPaused]);

  const allReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredReports = allReports.filter(r => {
    const matchesState = filterState === 'ALL' || r.state.toLowerCase() === filterState.toLowerCase();
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'VERIFIED' && r.status === 'VERIFIED') ||
                         (filterStatus === 'UNVERIFIED' && r.status !== 'VERIFIED');
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Breadcrumbs
        title="Live Ground Intelligence Stream"
        description="High-velocity crowdsourced citizen reports, IoT rain gauge pings, and social streams processed in real-time by the AI Truth Engine."
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStreamPaused(!isStreamPaused)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono font-bold transition-all ${
                isStreamPaused
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {isStreamPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isStreamPaused ? 'RESUME STREAM' : 'PAUSE STREAM'}</span>
            </button>
          </div>
        }
      />

      {/* Control Bar */}
      <div className="p-4 rounded-xl bg-command-card border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search incoming stream..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 outline-none"
            />
          </div>

          <select
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All States</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi NCR">Delhi NCR</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${aiStatus === 'Online' ? 'bg-cyan-400' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${aiStatus === 'Online' ? 'bg-cyan-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-slate-300 font-bold">
              AI INTELLIGENCE: {aiStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isStreamPaused ? 'bg-amber-400' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreamPaused ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-slate-300 font-bold">
              {isStreamPaused ? 'STREAM PAUSED' : 'LIVE INGESTION ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Ingestion Cards Stream */}
      <div className="space-y-3">
        {filteredReports.map((report, idx) => (
          <div
            key={`${report.id}-${idx}`}
            onClick={() => setSelectedReport(report)}
            className="p-4 rounded-xl bg-command-card border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/60 transition-all cursor-pointer space-y-2 shadow-md animate-fadeIn"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  LIVE
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="font-mono text-xs text-slate-500">• {report.source}</span>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={report.status} size="sm" />
                <SeverityBadge severity={report.severity} size="sm" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-100 font-sans">{report.title}</h4>
                <p className="text-xs text-slate-300 font-sans mt-0.5">"{report.text}"</p>
              </div>

              <div className="text-right font-mono shrink-0">
                <span className="text-sm font-bold text-emerald-400">{report.trustScore}%</span>
                <span className="text-[10px] text-slate-500 block uppercase">Trust Score</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-500/40 text-[10px] font-mono font-bold">
                AI EVENT: {report.mlEventType ? `${report.mlEventType} (${report.mlConfidence ? Math.round(report.mlConfidence * 100) : '--'}%)` : 'Not available'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${report.verificationRecommendation === 'HIGH_CONFIDENCE' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40' : report.verificationRecommendation === 'REQUIRES_HUMAN_REVIEW' ? 'bg-amber-950/60 text-amber-400 border-amber-500/40' : report.verificationRecommendation ? 'bg-red-950/60 text-red-400 border-red-500/40' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>
                AI REC: {report.verificationRecommendation || '—'}
              </span>
            </div>

            <details className="group border-t border-slate-800/80 mt-2 pt-2">
              <summary className="text-[10px] font-mono text-cyan-400 cursor-pointer list-none flex items-center gap-1 hover:text-cyan-300">
                <span>AI ANALYSIS ▼</span>
              </summary>
              <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                <div>
                  <span className="text-slate-500 block mb-0.5">Event Classification</span>
                  <span className="text-purple-400 font-bold">{report.mlEventType || 'Not available'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Model Confidence</span>
                  <span className="text-slate-200 font-bold">{report.mlConfidence ? `${Math.round(report.mlConfidence * 100)}%` : '—'}</span>
                </div>
                
                {/* Phase 5: Location Intelligence */}
                <div>
                  <span className="text-slate-500 block mb-0.5">Resolved Location</span>
                  <span className="text-cyan-400 font-bold">{report.resolvedCity ? `${report.resolvedCity}, ${report.resolvedState}` : '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Location Confidence</span>
                  <span className="text-slate-200 font-bold">{report.locationConfidence ? `${Math.round(report.locationConfidence * 100)}%` : '—'}</span>
                </div>
                
                {/* Phase 5: Duplicate Detection */}
                <div className="col-span-2 border-t border-slate-800/80 pt-2 mt-1">
                  <span className="text-slate-500 block mb-0.5">Duplicate Analysis</span>
                  {report.isDuplicate ? (
                    <span className="text-amber-400 font-bold flex items-center gap-2">
                      ⚠️ DUPLICATE of #{report.duplicateOfId?.slice(-6) || 'Unknown'} 
                      <span className="text-slate-500 text-[9px]">(Similarity: {report.duplicateSimilarity ? Math.round(report.duplicateSimilarity * 100) : 0}%)</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">✓ ORIGINAL INCIDENT</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Trust Score</span>
                  <span className="text-emerald-400 font-bold">{report.trustScore ? `${report.trustScore}%` : '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">AI Recommendation</span>
                  <span className="text-slate-200 font-bold">{report.verificationRecommendation || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block mb-0.5">Model Version</span>
                  <span className="text-slate-400">event_classifier_v1</span>
                </div>
              </div>
            </details>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 gap-2">
              <span className="flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {report.district || report.locationName}, {report.state}
              </span>
              <div className="flex items-center gap-3">
                {report.status !== 'VERIFIED' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Optimistic update for realtime feel
                      setReports(prev => prev.map(r => r.id === report.id ? {...r, status: 'VERIFIED'} : r));
                      await reportApi.verifyReport(report.id);
                    }}
                    className="px-2 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 rounded font-bold hover:bg-emerald-900"
                  >
                    Verify
                  </button>
                )}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirmed = window.confirm('Delete this report?');
                    if (confirmed) {
                      // Optimistic update
                      setReports(prev => prev.filter(r => r.id !== report.id));
                      await reportApi.deleteReport(report.id);
                    }
                  }}
                  className="px-2 py-1 bg-red-950/60 text-red-400 border border-red-500/30 rounded font-bold hover:bg-red-900"
                >
                  Delete
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedReport(report);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <span>Inspect Forensic Verification</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
