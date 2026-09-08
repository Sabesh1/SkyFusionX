import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Search, X, MapPin, AlertTriangle, Cpu, Radio, ChevronRight } from 'lucide-react';
import { eventApi } from '../../services/eventApi';
import { reportApi } from '../../services/reportApi';
import { ClusteredWeatherEvent } from '../../types/event';
import { WeatherReport } from '../../types/report';
import { INDIAN_STATES_DATA } from '../../data/indiaGeoData';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setSelectedReport } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const [events, setEvents] = useState<ClusteredWeatherEvent[]>([]);
  const [reports, setReports] = useState<WeatherReport[]>([]);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      eventApi.getWeatherEvents().then(setEvents);
      reportApi.getLiveReports().then(setReports);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const filteredEvents = query
    ? events.filter(
        e =>
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.location.toLowerCase().includes(query.toLowerCase()) ||
          e.state.toLowerCase().includes(query.toLowerCase())
      )
    : events.slice(0, 3);

  const filteredReports = query
    ? reports.filter(
        r =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.locationName.toLowerCase().includes(query.toLowerCase()) ||
          r.text.toLowerCase().includes(query.toLowerCase())
      )
    : reports.slice(0, 3);

  const states = Object.values(INDIAN_STATES_DATA).filter(s =>
    query ? s.name.toLowerCase().includes(query.toLowerCase()) : false
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-theme-card border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden">
        {/* Search input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-theme-border bg-theme-surface">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events, cities, reports, sensor nodes (e.g. Chennai, Flood, Velachery)..."
            className="flex-1 bg-transparent text-theme-text placeholder-slate-500 text-sm focus:outline-none font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-theme-muted hover:text-theme-text">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-card text-theme-muted border border-theme-border-hover">
            ESC
          </span>
          <button onClick={() => setIsSearchOpen(false)} className="text-theme-muted hover:text-theme-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {/* Quick Navigation Pages */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-theme-muted mb-2 px-2">
              Command Modules
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Truth Engine', path: '/truth-engine', icon: Cpu },
                { name: 'Live Intel Stream', path: '/live-intel', icon: Radio },
                { name: 'Risk Heatmap', path: '/risk-heatmap', icon: MapPin },
                { name: 'Predictions', path: '/predictions', icon: AlertTriangle },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-theme-surface/60 border border-theme-border hover:border-cyan-500/40 hover:bg-cyan-950/20 text-theme-text hover:text-cyan-300 transition-all text-left"
                >
                  <item.icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Disaster Events */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-theme-muted mb-2 px-2 flex justify-between">
              <span>Disaster Incidents</span>
              <span className="text-cyan-400">{filteredEvents.length} found</span>
            </div>
            <div className="space-y-1.5">
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => {
                    navigate(`/events/${event.id}`);
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-theme-surface/40 border border-theme-border/80 hover:border-cyan-500/50 hover:bg-theme-card/60 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        event.severity === 'CRITICAL'
                          ? 'bg-red-500 animate-ping'
                          : event.severity === 'HIGH'
                          ? 'bg-orange-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-theme-text">{event.eventName}</div>
                      <div className="text-[11px] text-theme-muted">{event.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">{event.trustScore}% Trust</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incoming Reports */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-theme-muted mb-2 px-2 flex justify-between">
              <span>Ground Intelligence Reports</span>
              <span className="text-cyan-400">{filteredReports.length} found</span>
            </div>
            <div className="space-y-1.5">
              {filteredReports.map(report => (
                <div
                  key={report.id}
                  onClick={() => {
                    setSelectedReport(report);
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-theme-surface/40 border border-theme-border/80 hover:border-cyan-500/50 hover:bg-theme-card/60 cursor-pointer transition-all"
                >
                  <div className="truncate pr-4">
                    <div className="font-medium text-theme-text truncate">{report.title}</div>
                    <div className="text-[11px] text-theme-muted truncate">{report.locationName} • {report.source}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-theme-card text-cyan-300 shrink-0">
                    {report.trustScore}% Trust
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-theme-bg border-t border-theme-border/80 flex items-center justify-between text-[11px] font-mono text-theme-muted">
          <span>Search index updated across 14 Indian states</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
