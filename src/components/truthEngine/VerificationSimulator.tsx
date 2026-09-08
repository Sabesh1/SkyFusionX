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
    <div className="p-6 md:p-8 rounded-3xl bg-theme-card border border-theme-border/80 space-y-6 shadow-card-emboss">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/40 text-[10px] font-mono font-bold uppercase">
              Interactive Lab
            </span>
            <span className="font-mono text-xs text-theme-muted">Bayesian Real-Time Simulator</span>
          </div>
          <h3 className="text-lg font-bold font-display text-theme-text mt-1 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-theme-primary" />
            AI Truth Verification Simulation Sandbox
          </h3>
          <p className="text-xs text-theme-muted font-sans mt-0.5">
            Adjust the 7 factor weight sliders to dynamically calculate the Bayesian verification score.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handlePreset('high')}
            className="px-3 py-1.5 rounded-full bg-theme-primary/10 hover:bg-theme-primary/20 border border-theme-primary/60 text-theme-primary text-xs font-mono font-bold transition-all shadow-primary-sm"
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
            <span className="text-xs font-mono uppercase font-bold text-theme-primary">
              Adjust 7 Bayesian Input Weights:
            </span>
            <span className="text-[10px] font-mono text-theme-muted">Interactive Controls</span>
          </div>

          <FactorBreakdown
            factors={factors}
            interactive={true}
            onFactorChange={handleFactorChange}
          />
        </div>

        {/* Right 5 Cols: Live Calculated Gauge & Verdict */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-theme-surface border border-theme-border/80 shadow-card-inset flex flex-col items-center justify-center text-center space-y-4">
          <TrustScoreGauge
            score={calculation.trustScore}
            size="xl"
            verdict={calculation.verdict}
            subtext="Real-time Bayesian Convergence"
          />

          <div className="w-full p-4 rounded-xl bg-theme-bg border border-theme-border/80 text-xs font-sans text-theme-text leading-relaxed text-left">
            <span className="font-mono text-theme-primary font-bold uppercase block mb-1">
              AI Verification Verdict:
            </span>
            {calculation.verdict === 'VERIFIED'
              ? 'Multi-sensor convergence exceeds threshold (>85%). Ground observation validated with orbital and radar telemetry.'
              : calculation.verdict === 'PARTIALLY VERIFIED'
              ? 'Moderate convergence (70-84%). Dispatched for priority officer review.'
              : 'Low convergence (<70%). Quarantined to prevent disinformation spread.'}
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-[10px] font-mono text-theme-muted">
            <div className="p-2 rounded-lg bg-theme-bg border border-theme-border/80">
              Confidence: <strong className="text-theme-primary">{calculation.confidenceLevel}</strong>
            </div>
            <div className="p-2 rounded-lg bg-theme-bg border border-theme-border/80">
              Compute Latency: <strong className="text-theme-primary">18ms</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
