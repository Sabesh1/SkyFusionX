import React, { useState } from 'react';
import { VerificationFactors } from '../../types/report';
import { aiApi } from '../../services/aiApi';
import { FactorBreakdown } from './FactorBreakdown';
import { TrustScoreGauge } from '../common/TrustScoreGauge';
import { Sparkles, RefreshCw, Cpu, CheckCircle2, RotateCcw } from 'lucide-react';
import { soundFX } from '../../utils/soundEffects';

export const VerificationSimulator: React.FC = () => {
  const [factors, setFactors] = useState<VerificationFactors>({
    sourceCredibility: 90,
    locationMatch: 95,
    timestampValidity: 95,
    weatherApiMatch: 85,
    nearbyReports: 90,
    visualEvidence: 80,
    satelliteCorrelation: 88,
  });

  const calculation = aiApi.calculateTrustScore(factors);

  const handleFactorChange = (key: keyof VerificationFactors, val: number) => {
    setFactors(prev => ({ ...prev, [key]: val }));
  };

  const handlePreset = (presetName: 'high' | 'medium' | 'fake') => {
    soundFX.playClick();
    if (presetName === 'high') {
      setFactors({
        sourceCredibility: 95,
        locationMatch: 98,
        timestampValidity: 100,
        weatherApiMatch: 92,
        nearbyReports: 90,
        visualEvidence: 85,
        satelliteCorrelation: 94,
      });
    } else if (presetName === 'medium') {
      setFactors({
        sourceCredibility: 70,
        locationMatch: 75,
        timestampValidity: 80,
        weatherApiMatch: 65,
        nearbyReports: 60,
        visualEvidence: 70,
        satelliteCorrelation: 72,
      });
    } else {
      setFactors({
        sourceCredibility: 15,
        locationMatch: 20,
        timestampValidity: 90,
        weatherApiMatch: 10,
        nearbyReports: 5,
        visualEvidence: 12,
        satelliteCorrelation: 8,
      });
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#1C1C24] to-[#121217] border border-[#2B2B3C] space-y-6 shadow-card-emboss">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252534] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#2A2016] text-[#E5A962] border border-[#E5A962]/40 text-[10px] font-mono font-bold uppercase">
              Interactive Lab
            </span>
            <span className="font-mono text-xs text-slate-400">Bayesian Real-Time Simulator</span>
          </div>
          <h3 className="text-lg font-bold font-display text-[#EEEEF2] mt-1 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#E5A962]" />
            AI Truth Verification Simulation Sandbox
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Adjust the 7 factor weight sliders to dynamically calculate the Bayesian verification score.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handlePreset('high')}
            className="px-3 py-1.5 rounded-full bg-[#2E2417] hover:bg-[#3D2E1C] border border-[#E5A962]/60 text-[#F3C58E] text-xs font-mono font-bold transition-all shadow-gold-sm"
          >
            Verified Case (94%)
          </button>
          <button
            onClick={() => handlePreset('medium')}
            className="px-3 py-1.5 rounded-full bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition-all"
          >
            Review Case (71%)
          </button>
          <button
            onClick={() => handlePreset('fake')}
            className="px-3 py-1.5 rounded-full bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 text-xs font-mono font-bold transition-all"
          >
            Fake Hoax (12%)
          </button>
        </div>
      </div>

      {/* Grid: Sliders (Left 7) + Live Score Output (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left 7 Cols: Sliders */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-[#E5A962]">
              Adjust 7 Bayesian Input Weights:
            </span>
            <span className="text-[10px] font-mono text-slate-400">Interactive Controls</span>
          </div>

          <FactorBreakdown
            factors={factors}
            interactive={true}
            onFactorChange={handleFactorChange}
          />
        </div>

        {/* Right 5 Cols: Live Calculated Gauge & Verdict */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#16161E] border border-[#2B2B3C] shadow-card-inset flex flex-col items-center justify-center text-center space-y-4">
          <TrustScoreGauge
            score={calculation.trustScore}
            size="xl"
            verdict={calculation.verdict}
            subtext="Real-time Bayesian Convergence"
          />

          <div className="w-full p-4 rounded-xl bg-[#1A1A24] border border-[#272736] text-xs font-sans text-slate-300 leading-relaxed text-left">
            <span className="font-mono text-[#E5A962] font-bold uppercase block mb-1">
              AI Verification Verdict:
            </span>
            {calculation.verdict === 'VERIFIED'
              ? 'Multi-sensor convergence exceeds threshold (>85%). Ground observation validated with orbital and radar telemetry.'
              : calculation.verdict === 'PARTIALLY VERIFIED'
              ? 'Moderate convergence (70-84%). Dispatched for priority officer review.'
              : 'Low convergence (<70%). Quarantined to prevent disinformation spread.'}
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
            <div className="p-2 rounded-lg bg-[#20202C] border border-[#2A2A3A]">
              Confidence: <strong className="text-[#E5A962]">{calculation.confidenceLevel}</strong>
            </div>
            <div className="p-2 rounded-lg bg-[#20202C] border border-[#2A2A3A]">
              Compute Latency: <strong className="text-emerald-400">18ms</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
