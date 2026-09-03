import React from 'react';
import { useApp } from '../../context/AppContext';
import { SeverityBadge, StatusBadge } from './SeverityBadge';
import { TrustScoreGauge } from './TrustScoreGauge';
import { FactorBreakdown } from '../truthEngine/FactorBreakdown';
import {
  X,
  MapPin,
  Clock,
  Radio,
  Satellite,
  ShieldCheck,
  Camera,
  ExternalLink,
  Bot,
  Activity,
  Layers,
  FileCheck2,
} from 'lucide-react';

export const ReportDetailModal: React.FC = () => {
  const { selectedReport, setSelectedReport } = useApp();

  if (!selectedReport) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Slide-out Drawer (40% width) */}
      <div className="w-full max-w-xl h-full bg-[#0E121A] border-l border-slate-800/80 shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
        {/* Drawer Header */}
        <div className="h-16 px-6 bg-[#0B0E14] border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-cyan-400 font-bold">
              {selectedReport.id}
            </span>
            <SeverityBadge severity={selectedReport.severity} size="sm" />
            <StatusBadge status={selectedReport.status} size="sm" />
          </div>

          <button
            onClick={() => setSelectedReport(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Claim Title & Text */}
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-100 font-sans leading-snug">
              {selectedReport.title}
            </h2>
            <p className="text-xs text-slate-300 font-sans leading-relaxed bg-[#121620] p-4 rounded-xl border border-slate-800/60">
              "{selectedReport.text}"
            </p>
          </div>

          {/* Section 1: 📍 Location */}
          <div className="p-4 rounded-xl bg-[#121620] border border-slate-800/80 space-y-2.5">
            <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              📍 Location & Geocoding
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-300">
              <div>
                <span className="text-slate-500 text-[10px] block">Landmark</span>
                {selectedReport.locationName}
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">District & State</span>
                {selectedReport.district}, {selectedReport.state}
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">GPS Coordinates</span>
                {selectedReport.coordinates.lat.toFixed(4)}°N, {selectedReport.coordinates.lng.toFixed(4)}°E
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Time Ingested</span>
                {new Date(selectedReport.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Section 2: 🤖 AI Verification */}
          <div className="p-5 rounded-xl bg-[#121620] border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              🤖 AI Truth Verification (7 Factors)
            </h3>

            <div className="flex items-center justify-center py-2">
              <TrustScoreGauge score={selectedReport.trustScore} size="md" />
            </div>

            <div className="p-3 rounded-lg bg-[#0B0E14] border border-slate-800/60 text-xs text-slate-300 leading-relaxed font-sans">
              <strong className="text-cyan-400 font-mono text-[11px] block mb-1">Bayesian Analysis:</strong>
              {selectedReport.aiExplanation}
            </div>

            <FactorBreakdown factors={selectedReport.verificationFactors} interactive={false} />
          </div>

          {/* Section 3: 🛰️ Data Sources */}
          <div className="p-4 rounded-xl bg-[#121620] border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Satellite className="w-3.5 h-3.5 text-cyan-400" />
              🛰️ Corroborating Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#0B0E14] border border-slate-800/60">
                <span className="text-slate-500 text-[10px]">Matched AWS Station</span>
                <p className="text-slate-200 font-bold mt-0.5">{selectedReport.matchedStationId}</p>
                <p className="text-cyan-400 text-[10px] mt-1">{selectedReport.matchedStationRainfallMm} mm/hr ({selectedReport.matchedStationDistanceKm}km away)</p>
              </div>

              <div className="p-3 rounded-lg bg-[#0B0E14] border border-slate-800/60">
                <span className="text-slate-500 text-[10px]">Satellite / Radar</span>
                <p className="text-slate-200 font-bold mt-0.5">INSAT-3D Thermal</p>
                <p className="text-emerald-400 text-[10px] mt-1">-74°C Squall Core</p>
              </div>
            </div>
          </div>

          {/* Section 4: 📸 Evidence */}
          <div className="p-4 rounded-xl bg-[#121620] border border-slate-800/80 space-y-3">
            <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              📸 Ground Visual Evidence
            </h3>

            <div className="p-3 rounded-lg bg-[#0B0E14] border border-slate-800/60 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Computer Vision Authenticity:</span>
                <span className="text-emerald-400 font-bold">94% Authentic</span>
              </div>
              <div className="flex justify-between">
                <span>EXIF GPS Consistency:</span>
                <span className="text-slate-200 font-bold">Matched (0.2km delta)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
