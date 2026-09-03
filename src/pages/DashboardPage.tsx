import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { weatherApi, DashboardStats } from '../services/weatherApi';
import { eventApi } from '../services/eventApi';
import { ClusteredWeatherEvent } from '../types/event';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { KpiCard } from '../components/common/KpiCard';
import { IndiaWeatherMap } from '../components/map/IndiaWeatherMap';
import { WeatherGlobe3D } from '../components/globe/WeatherGlobe3D';
import { RiskLegend } from '../components/map/RiskLegend';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { useDemoMode } from '../context/DemoModeContext';
import { soundFX } from '../utils/soundEffects';
import {
  Layers,
  ShieldCheck,
  Radio,
  TriangleAlert,
  Flame,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Globe,
  Map,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<ClusteredWeatherEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ClusteredWeatherEvent | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<'3d' | '2d'>('3d');
  const { totalReportCounter, verifiedCounter } = useDemoMode();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [statsData, eventsData] = await Promise.all([
        weatherApi.getDashboardStats(),
        eventApi.getWeatherEvents(),
      ]);
      setStats(statsData);
      setEvents(eventsData);
      setSelectedEvent(eventsData[0]); // Default to Chennai
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <Breadcrumbs
        title="National Weather Intelligence"
        description="Real-time multi-modal weather surveillance and AI truth verification across India."
        actionButton={
          <div className="flex items-center gap-2">
            {/* 3D vs 2D Centerpiece Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[#121620] border border-slate-800/80">
              <button
                onClick={() => {
                  soundFX.playClick();
                  setVisualizationMode('3d');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  visualizationMode === '3d'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>3D Earth</span>
              </button>

              <button
                onClick={() => {
                  soundFX.playClick();
                  setVisualizationMode('2d');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  visualizationMode === '2d'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>2D Radar</span>
              </button>
            </div>

            <button
              onClick={() => navigate('/truth-engine')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-medium transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Truth Engine</span>
            </button>
          </div>
        }
      />

      {/* Row 1: 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Reports Ingested"
          value={stats?.totalReports.value || 0}
          subtext="Updated live from national stream"
          icon={Layers}
          onClick={() => navigate('/live-intel')}
        />

        <KpiCard
          title="AI Truth Verified"
          value={stats?.aiVerified.value || '0'}
          subtext="High Convergence"
          icon={ShieldCheck}
          onClick={() => navigate('/truth-engine')}
        />

        <KpiCard
          title="Active Weather Events"
          value={events.length > 0 ? events.length : 46}
          subtext="Across 14 State Sectors"
          icon={Radio}
          onClick={() => navigate('/events')}
        />

        <KpiCard
          title="Critical Response Zones"
          value={12}
          subtext="NDRF Alert Level-4"
          icon={Flame}
          alertPulse={true}
          onClick={() => navigate('/risk-heatmap')}
        />
      </div>

      {/* Row 2: 2 Secondary KPI Cards (Spacious) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Suspicious Reports Quarantined"
          value={stats?.suspiciousReports.value || 0}
          subtext="Filtered by AI Truth Engine"
          icon={TriangleAlert}
          onClick={() => navigate('/truth-engine')}
        />

        <KpiCard
          title="Pending Admin Review"
          value={stats?.reportsLastHour.value || 0}
          subtext="Awaiting verification"
          icon={Clock}
          onClick={() => navigate('/live-intel')}
        />
      </div>

      {/* Main Command Grid: 70% Centerpiece (Left 8 cols) + 3-4 Live Event Cards (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols (70%): Interactive 3D Earth Globe or 2D Regional Radar Map */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative">
            {visualizationMode === '3d' ? (
              <WeatherGlobe3D
                events={events}
                onSelectEvent={ev => setSelectedEvent(ev)}
                height="530px"
              />
            ) : (
              <>
                <IndiaWeatherMap
                  events={events}
                  selectedEventId={selectedEvent?.id}
                  onSelectEvent={ev => setSelectedEvent(ev)}
                  height="530px"
                  zoomLevel={5}
                />
                {/* Map Legend Overlay for 2D Mode */}
                <div className="absolute bottom-4 left-4 z-[400]">
                  <RiskLegend orientation="horizontal" />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>
              {visualizationMode === '3d'
                ? '3D orbital stream synchronized with INSAT-3D thermal scans'
                : 'Surveillance grid updated continuously with INSAT-3D thermal scans'}
            </span>
            <span className="text-cyan-400 font-semibold">1,284 Stations Online</span>
          </div>
        </div>

        {/* Right 4 Cols (30%): Strictly 3-4 Clean Live Event Cards */}
        <div className="lg:col-span-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <h3 className="text-xs font-mono uppercase font-bold text-slate-200">
                Live Disaster Events
              </h3>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Event Cards Feed */}
          <div className="space-y-3">
            {events.slice(0, 4).map(event => {
              const isSelected = selectedEvent?.id === event.id;

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-[#141926] border-cyan-500/60 ring-1 ring-cyan-500/30'
                      : 'bg-[#121620] border-slate-800/80 hover:border-slate-700 hover:bg-[#161B28]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={event.severity} size="sm" />
                        <span className="text-xs font-bold text-slate-100 font-sans">
                          {event.eventName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans mt-1">{event.location}</p>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="text-sm font-bold text-emerald-400">
                        {event.trustScore}%
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">Trust</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                    <span>{event.totalReports} reports</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/events/${event.id}`);
                      }}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      <span>Drilldown</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
