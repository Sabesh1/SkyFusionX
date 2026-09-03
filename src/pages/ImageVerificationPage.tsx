import React from 'react';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { EvidenceAnalyzer } from '../components/imageVerification/EvidenceAnalyzer';
import {
  FileCheck2,
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

export const ImageVerificationPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <Breadcrumbs
        title="Visual Evidence Verification Lab"
        description="Multi-spectral computer vision, EXIF GPS header forensics, and satellite cloud-cover cross validation to verify disaster ground photographs and eliminate misinformation."
      />

      {/* Forensic Pipeline Visualizer */}
      <div className="p-6 rounded-2xl bg-command-card border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            End-to-End Image Forensics Pipeline
          </h3>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">
            CV Model: YOLO-Disaster v8 + ForensicEXIF
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center font-mono text-xs">
          {[
            { step: '1. Ingest', label: 'Ground Photo', color: 'text-slate-300' },
            { step: '2. CV Detect', label: 'Object Mask', color: 'text-cyan-400' },
            { step: '3. Hazard Check', label: 'Flood / Squall', color: 'text-blue-400' },
            { step: '4. EXIF Match', label: 'GPS Coordinates', color: 'text-emerald-400' },
            { step: '5. Time Delta', label: 'Capture Stamp', color: 'text-amber-400' },
            { step: '6. Radar Cross', label: 'AWS Telemetry', color: 'text-purple-400' },
            { step: '7. Output', label: 'Authenticity %', color: 'text-emerald-400 font-bold' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1"
            >
              <div className="text-[9px] text-slate-500 uppercase font-bold">{item.step}</div>
              <div className={`text-xs font-bold ${item.color}`}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Interactive Evidence Analyzer */}
      <EvidenceAnalyzer />
    </div>
  );
};
