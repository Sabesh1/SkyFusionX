import React, { useEffect, useState, useRef } from 'react';
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
  Zap,
  ZapOff,
  RefreshCw,
} from 'lucide-react';

export const LiveIntelligencePage: React.FC = () => {
  const [reports, setReports] = useState<WeatherReport[]>([]);
  const [isStreamPaused, setIsStreamPaused] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterEvent, setFilterEvent] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterTime, setFilterTime] = useState('ALL');
  const [aiStatus, setAiStatus] = useState<'Online' | 'Unavailable'>('Unavailable');
  const [isProcessingActive, setIsProcessingActive] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { liveReports } = useDemoMode();
  const { setSelectedReport, addToast } = useApp();

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
          if (newReport) {
            setReports(current => {
              if (current.find(r => r.id === id)) return current;
              return [newReport, ...current];
            });
          }
        });
      }
    };
    window.addEventListener('report_submitted', handleSubmission);

    // Check for Gemini status
    apiClient.get<any>('/health').then(health => {
      if (health) setAiStatus('Online');
    }).catch(() => { });

    return () => {
      window.removeEventListener('report_submitted', handleSubmission);
    };
  }, []);

  // Processing engine: auto-reprocess stuck reports periodically
  useEffect(() => {
    if (!isProcessingActive) {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      return;
    }

    const runProcessingCycle = async () => {
      const stuckReports = reports.filter(r =>
        r.aiStatus === 'PROCESSING' || r.status === 'PROCESSING' || !r.mlEventType
      );
      setProcessingCount(stuckReports.length);

      // Process one per cycle to respect rate limits
      if (stuckReports.length > 0) {
        const target = stuckReports[0];
        await reportApi.reprocessReport(target.id);
        setReports(prev => prev.map(r => r.id === target.id
          ? { ...r, aiStatus: 'PROCESSING', status: 'PROCESSING' }
          : r
        ));
        // Re-fetch updated report after 8 seconds
        setTimeout(async () => {
          const updated = await reportApi.getReportById(target.id);
          if (updated) {
            setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
          }
        }, 8000);
      }
    };

    // Run immediately then every 15 seconds
    runProcessingCycle();
    processingIntervalRef.current = setInterval(runProcessingCycle, 15000);

    return () => {
      if (processingIntervalRef.current) clearInterval(processingIntervalRef.current);
    };
  }, [isProcessingActive, reports]);

  useEffect(() => {
    if (isStreamPaused) return;

    // Setup SSE connection
    const evtSource = apiClient.createEventSource('/api/v1/events/stream');
    if (evtSource) {
      evtSource.addEventListener('report_processed', (e: any) => {
        try {
          const rawData = JSON.parse(e.data);
          const eventId = rawData.event_id || rawData.id;
          const incomingVersion = rawData.version || 0;

          reportApi.getReportById(eventId).then(newReport => {
            if (newReport) {
              setReports(prev => {
                const exists = prev.findIndex(r => r.id === eventId);
                if (exists >= 0) {
                  const current = prev[exists];
                  const currentVersion = current.version || 0;
                  // Version-safe rejection: reject stale updates
                  if (incomingVersion <= currentVersion) {
                    console.log(`Rejected stale update: ${eventId} v${incomingVersion} <= v${currentVersion}`);
                    return prev;
                  }
                  const updated = [...prev];
                  updated[exists] = { ...newReport, version: incomingVersion };
                  return updated;
                }
                return [{ ...newReport, version: incomingVersion }, ...prev];
              });
            }
          });
        } catch (err) {
          console.error('Failed to parse stream event', err);
        }
      });

      evtSource.addEventListener('weather_event_update', (e: any) => {
        try {
          const rawData = JSON.parse(e.data);
          // Ignore if it's already handled by report_processed
          if (rawData.type === 'report_processed') return;

          const eventId = rawData.event_id || rawData.id;
          const incomingVersion = rawData.version || 0;

          reportApi.getReportById(eventId).then(newReport => {
            if (newReport) {
              setReports(prev => {
                const exists = prev.findIndex(r => r.id === eventId);
                if (exists >= 0) {
                  const current = prev[exists];
                  const currentVersion = current.version || 0;
                  // Version-safe rejection: reject stale updates
                  if (incomingVersion <= currentVersion) {
                    console.log(`Rejected stale update: ${eventId} v${incomingVersion} <= v${currentVersion}`);
                    return prev;
                  }
                  const updated = [...prev];
                  updated[exists] = { ...newReport, version: incomingVersion };
                  return updated;
                }
                return [{ ...newReport, version: incomingVersion }, ...prev];
              });
            }
          });
        } catch (err) {
          console.error('Failed to parse stream event', err);
        }
      });

      evtSource.addEventListener('demo_stream_complete', (e: any) => {
        setIsStreamPaused(true);
        addToast({
          type: 'success',
          title: 'Demo Stream Complete',
          message: 'All queued demo reports have been successfully released.',
        });
      });

      return () => {
        evtSource.close();
      };
    }
  }, [isStreamPaused]);

  const allReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredReports = allReports.filter(r => {
    // Location
    const matchesState = filterState === 'ALL' || r.state.toLowerCase() === filterState.toLowerCase();
    
    // Status
    let matchesStatus = true;
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'VERIFIED') matchesStatus = r.status === 'VERIFIED';
      else if (filterStatus === 'PENDING') matchesStatus = r.status === 'UNDER_REVIEW' || r.status === 'PROCESSING';
      else if (filterStatus === 'REJECTED') matchesStatus = r.status === 'REJECTED';
      else if (filterStatus === 'SUSPICIOUS') matchesStatus = r.trustScore < 50; // simple heuristic
    }

    // Source
    let matchesSource = true;
    if (filterSource !== 'ALL') {
      const src = r.source.toLowerCase();
      if (filterSource === 'CITIZEN') matchesSource = src.includes('citizen');
      else if (filterSource === 'SOCIAL') matchesSource = src.includes('social') || src.includes('twitter');
      else if (filterSource === 'API') matchesSource = src.includes('api') || src.includes('sensor');
      else if (filterSource === 'WEB') matchesSource = src.includes('web');
    }

    // Event
    let matchesEvent = true;
    if (filterEvent !== 'ALL') {
      matchesEvent = (r.event || '').toLowerCase().includes(filterEvent.toLowerCase()) || 
                     (r.mlEventType || '').toLowerCase().includes(filterEvent.toLowerCase());
    }

    // Risk/Truth
    let matchesRisk = true;
    if (filterRisk !== 'ALL') {
      if (filterRisk === 'HIGH') matchesRisk = r.trustScore >= 80;
      else if (filterRisk === 'MEDIUM') matchesRisk = r.trustScore >= 50 && r.trustScore < 80;
      else if (filterRisk === 'LOW') matchesRisk = r.trustScore < 50;
    }

    // Time
    let matchesTime = true;
    if (filterTime !== 'ALL') {
      const reportTime = new Date(r.timestamp).getTime();
      const now = Date.now();
      if (filterTime === 'HOUR') matchesTime = (now - reportTime) <= 3600000;
      else if (filterTime === 'TODAY') matchesTime = (now - reportTime) <= 86400000;
    }

    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.text.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesState && matchesStatus && matchesSource && matchesEvent && matchesRisk && matchesTime && matchesSearch;
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
              onClick={async () => {
                setIsProcessingActive(prev => !prev);
                if (!isProcessingActive) {
                  // Also trigger a fresh fetch when starting
                  const data = await reportApi.getLiveReports();
                  setReports(data);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono font-bold transition-all ${isProcessingActive
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 animate-pulse'
                : 'bg-theme-surface border-theme-border-hover text-theme-muted hover:border-purple-500/50 hover:text-purple-300'
                }`}
            >
              {isProcessingActive ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
              <span>{isProcessingActive ? `AI ENGINE RUNNING (${processingCount} queued)` : 'START AI PROCESSING'}</span>
            </button>
            <button
              onClick={async () => {
                const newState = !isStreamPaused;
                setIsStreamPaused(newState);
                if (!newState) {
                  await apiClient.post('/api/v1/events/demo/start', {});
                  addToast({ type: 'info', title: 'Streaming Resumed', message: 'Demo reports will be released sequentially.' });
                } else {
                  await apiClient.post('/api/v1/events/demo/stop', {});
                  addToast({ type: 'warning', title: 'Streaming Paused', message: 'Demo release has been halted.' });
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono font-bold transition-all ${isStreamPaused
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                }`}
            >
              {isStreamPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isStreamPaused ? 'RESUME STREAM' : 'PAUSE STREAM'}</span>
            </button>
            <button
              onClick={async () => {
                const data = await reportApi.getLiveReports();
                setReports(data);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono font-bold bg-theme-surface border-theme-border-hover text-theme-muted hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REFRESH</span>
            </button>
          </div>
        }
      />

      {/* Control Bar */}
      <div className="p-4 rounded-xl bg-theme-card border border-theme-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search incoming stream..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border focus:border-cyan-500 text-xs text-theme-text outline-none"
            />
          </div>

          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Sources</option>
            <option value="CITIZEN">Citizen Report</option>
            <option value="SOCIAL">Social Media</option>
            <option value="API">Weather API</option>
            <option value="WEB">Web Source</option>
          </select>

          <select
            value={filterEvent}
            onChange={e => setFilterEvent(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Events</option>
            <option value="Rainfall">Rainfall</option>
            <option value="Thunderstorm">Thunderstorm</option>
            <option value="Flooding">Flooding</option>
            <option value="Heatwave">Heatwave</option>
            <option value="Fog">Fog</option>
            <option value="Dust Storm">Dust Storm</option>
            <option value="Wind">Strong Wind</option>
          </select>

          <select
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Locations</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Kerala">Kerala</option>
            <option value="Odisha">Odisha</option>
            <option value="Goa">Goa</option>
            <option value="Assam">Assam</option>
            <option value="Telangana">Telangana</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi NCR">Delhi NCR</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending/Processing</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPICIOUS">Suspicious</option>
          </select>

          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Trust Levels</option>
            <option value="HIGH">High Confidence (&gt;=80)</option>
            <option value="MEDIUM">Medium Confidence (50-79)</option>
            <option value="LOW">Low Confidence (&lt;50)</option>
          </select>

          <select
            value={filterTime}
            onChange={e => setFilterTime(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:border-cyan-500 outline-none"
          >
            <option value="ALL">Latest (All Time)</option>
            <option value="HOUR">Last Hour</option>
            <option value="TODAY">Today</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-theme-border-hover pr-4">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${aiStatus === 'Online' ? 'bg-cyan-400' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${aiStatus === 'Online' ? 'bg-cyan-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-theme-text font-bold">
              AI INTELLIGENCE: {aiStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isStreamPaused ? 'bg-amber-400' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreamPaused ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-theme-text font-bold">
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
            className="p-4 rounded-xl bg-theme-card border border-theme-border hover:border-cyan-500/50 hover:bg-theme-surface/60 transition-all cursor-pointer space-y-2 shadow-md animate-fadeIn"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  LIVE
                </span>
                <span className="font-mono text-xs text-theme-muted">
                  {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="font-mono text-xs text-theme-muted">• {report.source}</span>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={report.status} size="sm" />
                <SeverityBadge severity={report.severity} size="sm" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-theme-text font-sans">{report.title}</h4>
                <p className="text-xs text-theme-text font-sans mt-0.5">"{report.text}"</p>
              </div>

              <div className="text-right font-mono shrink-0">
                <span className="text-sm font-bold text-emerald-400">{report.trustScore}%</span>
                <span className="text-[10px] text-theme-muted block uppercase">Trust Score</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${report.aiStatus === 'GEMINI ANALYZED' ? 'bg-purple-950/60 text-purple-400 border-purple-500/40' : report.aiStatus === 'PROCESSING' ? 'bg-amber-950/60 text-amber-400 border-amber-500/40' : report.aiStatus === 'FAILED' ? 'bg-red-950/60 text-red-400 border-red-500/40' : 'bg-theme-surface/60 text-theme-muted border-slate-500/40'}`}>
                AI EVENT: {report.aiStatus === 'PROCESSING' ? 'PROCESSING...' : (report.mlEventType ? `${report.mlEventType} (${report.mlConfidence ? Math.round(report.mlConfidence * 100) : '--'}%)` : 'Not available')}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${report.verificationRecommendation === 'HIGH_CONFIDENCE' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40' : report.verificationRecommendation === 'REQUIRES_HUMAN_REVIEW' ? 'bg-amber-950/60 text-amber-400 border-amber-500/40' : report.verificationRecommendation ? 'bg-red-950/60 text-red-400 border-red-500/40' : 'bg-theme-surface text-theme-muted border-theme-border-hover'}`}>
                AI REC: {report.verificationRecommendation || '—'}
              </span>
            </div>

            <details className="group border-t border-theme-border/80 mt-2 pt-2">
              <summary className="text-[10px] font-mono cursor-pointer list-none flex items-center gap-1 hover:text-cyan-300">
                <span className={report.aiStatus === 'GEMINI ANALYZED' ? 'text-purple-400 font-bold' : 'text-cyan-400'}>
                  {report.aiStatus === 'GEMINI ANALYZED' ? '▼ GEMINI EVIDENCE ANALYSIS' : '▼ AI ANALYSIS'}
                </span>
                {report.imageAnalyzed && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-500/30 text-[8px]">
                    📸 IMAGE ANALYZED
                  </span>
                )}
              </summary>
              <div className="pt-2 grid grid-cols-2 gap-3 text-[10px] font-mono text-theme-text">

                {/* Status Indicator */}
                <div className="col-span-2 flex items-center justify-between p-2 rounded bg-theme-surface/80 border border-theme-border-hover">
                  <div className="flex flex-col gap-1">
                    <span className="text-theme-muted">VERIFICATION ASSESSMENT</span>
                    <span className={`font-bold text-xs ${report.verificationAssessment === 'EVIDENCE_SUPPORTED' ? 'text-emerald-400' :
                      report.verificationAssessment === 'EVIDENCE_CONFLICTING' ? 'text-red-400' :
                        report.verificationAssessment === 'INSUFFICIENT_EVIDENCE' ? 'text-amber-400' :
                          report.verificationAssessment === 'REQUIRES_HUMAN_REVIEW' ? 'text-amber-400' :
                            'text-theme-muted'
                      }`}>
                      {report.verificationAssessment?.replace(/_/g, ' ') || 'UNAVAILABLE'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-theme-muted">CONFIDENCE</span>
                    <span className="text-theme-text font-bold">{report.mlConfidence ? `${Math.round(report.mlConfidence * 100)}%` : '—'}</span>
                  </div>
                </div>

                {/* Gemini Evidence Block */}
                {report.geminiAnalyzed && report.geminiEvidence ? (
                  <div className="col-span-2 space-y-3">
                    {report.geminiEvidence.supporting?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-emerald-500 font-bold">Supporting Evidence:</span>
                        <ul className="list-none space-y-1 text-[11px] font-sans">
                          {report.geminiEvidence.supporting.map((item, i) => (
                            <li key={i} className="flex gap-2 text-theme-text">
                              <span className="text-emerald-500">✓</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.geminiEvidence.contradicting?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-red-500 font-bold">Conflicting Evidence:</span>
                        <ul className="list-none space-y-1 text-[11px] font-sans">
                          {report.geminiEvidence.contradicting.map((item, i) => (
                            <li key={i} className="flex gap-2 text-theme-text">
                              <span className="text-red-500">✗</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-2 rounded bg-theme-surface border border-theme-border-hover/50">
                      <span className="text-theme-muted block mb-1">Conclusion / Assessment:</span>
                      <p className="text-theme-text font-sans text-xs leading-relaxed">
                        {report.geminiEvidence.assessment}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 p-2 rounded bg-amber-950/30 border border-amber-900/50 text-amber-500/80">
                    ⚠ Gemini Evidence Analysis Unavailable — Used Fallback AI Heuristics
                  </div>
                )}

                {/* Phase 5: Location Intelligence */}
                <div className="border-t border-theme-border/80 pt-2 mt-1">
                  <span className="text-theme-muted block mb-0.5">Resolved Location</span>
                  <span className="text-cyan-400 font-bold">{report.resolvedCity ? `${report.resolvedCity}, ${report.resolvedState}` : '—'}</span>
                </div>
                <div className="border-t border-theme-border/80 pt-2 mt-1">
                  <span className="text-theme-muted block mb-0.5">Location Confidence</span>
                  <span className="text-theme-text font-bold">{report.locationConfidence ? `${Math.round(report.locationConfidence * 100)}%` : '—'}</span>
                </div>

                {/* Phase 5: Duplicate Detection */}
                <div className="col-span-2 border-t border-theme-border/80 pt-2 mt-1">
                  <span className="text-theme-muted block mb-0.5">Duplicate Analysis</span>
                  {report.isDuplicate ? (
                    <span className="text-amber-400 font-bold flex items-center gap-2">
                      ⚠️ DUPLICATE of #{report.duplicateOfId?.slice(-6) || 'Unknown'}
                      <span className="text-theme-muted text-[9px]">(Similarity: {report.duplicateSimilarity ? Math.round(report.duplicateSimilarity * 100) : 0}%)</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">✓ ORIGINAL INCIDENT</span>
                  )}
                </div>

                <div className="col-span-2 text-right">
                  <span className="text-slate-600 block mb-0.5">Engine Version</span>
                  <span className="text-theme-muted">{report.modelVersion || 'none'}</span>
                </div>
              </div>
            </details>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-theme-border/80 text-[11px] font-mono text-theme-muted gap-2">
              <span className="flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {report.district || report.locationName}, {report.state}
              </span>
              <div className="flex items-center gap-3">
                {report.status !== 'VERIFIED' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'VERIFIED' } : r));
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
                    setReports(prev => prev.map(r => r.id === report.id ? { ...r, aiStatus: 'PROCESSING', status: 'PROCESSING' } : r));
                    await reportApi.reprocessReport(report.id);
                  }}
                  className="px-2 py-1 bg-purple-950/60 text-purple-400 border border-purple-500/30 rounded font-bold hover:bg-purple-900"
                >
                  Force AI Sync
                </button>
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
