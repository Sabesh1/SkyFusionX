import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Radio,
  LineChart,
  Globe,
  CheckCircle2,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLaunch = () => {
    soundFX.playRadarSweep();
    navigate('/dashboard');
  };

  const featureCards = [
    {
      icon: Cpu,
      title: '7-Factor Bayesian Truth Engine',
      description:
        'Mathematically verifies incoming disaster reports by fusing GPS, station telemetry, satellite thermal IR, and computer vision.',
    },
    {
      icon: Layers,
      title: 'Multi-Source Data Fusion',
      description:
        'Synchronizes INSAT-3D, 1,284 AWS stations, Doppler radars, and citizen crowdsourced pings with under 200ms latency.',
    },
    {
      icon: LineChart,
      title: '1-3h Predictive Flash Flood Risk',
      description:
        'Deep hydrodynamic forecasting predicting localized drainage overflow probabilities before emergency waterlogging occurs.',
    },
    {
      icon: Globe,
      title: 'Multilingual Warning Broadcast',
      description:
        'Automated instant CAP v1.2 emergency alert dispatch across 8 Indian languages with simulated voice audio readouts.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#EEEEF2] flex flex-col justify-between selection:bg-[#E5A962] selection:text-slate-950 font-sans">
      {/* Top Floating Navigation Pill */}
      <header className="px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E5A962] via-[#D49547] to-[#8C5E28] flex items-center justify-center text-slate-950 shadow-gold-glow">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-[#EEEEF2]">
              AI Weather Truth Engine
            </span>
            <span className="block text-[10px] font-mono text-[#E5A962] tracking-wider uppercase font-semibold">
              National Big Data Analytics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-full bg-[#181822] hover:bg-[#252532] border border-[#2B2B3C] text-xs font-mono text-slate-300 transition-colors"
          >
            Operator Sign In
          </button>
          <button
            onClick={handleLaunch}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#E5A962] to-[#B37B34] hover:from-[#F3C58E] hover:to-[#C88A3B] text-slate-950 text-xs font-mono font-bold transition-all shadow-gold-glow"
          >
            <span>Enter Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-6 py-16 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#201A12] border border-[#E5A962]/50 text-[#F3C58E] text-xs font-mono font-semibold shadow-gold-sm animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#E5A962]" />
          <span>Real-Time Weather Intelligence for a Safer India</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-[#EEEEF2] leading-[1.1]">
          Incontrovertible Truth in <br />
          <span className="bg-gradient-to-r from-[#F9ECD9] via-[#E5A962] to-[#B87B32] bg-clip-text text-transparent">
            Extreme Weather Crises
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-400 font-sans max-w-2xl mx-auto leading-relaxed">
          National disaster surveillance command center bridging citizen ground observations with ISRO satellites, Doppler radars, and Bayesian truth algorithms.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#E5A962] via-[#D49547] to-[#B37B34] text-slate-950 font-bold text-sm font-mono shadow-gold-glow hover:scale-105 transition-all"
          >
            <span>Launch Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/truth-engine')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#181822] hover:bg-[#252532] border border-[#2B2B3C] text-slate-200 text-sm font-mono transition-all"
          >
            <span>Inspect Truth Engine</span>
            <ChevronRight className="w-4 h-4 text-[#E5A962]" />
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 text-left">
          {featureCards.map((card, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-gradient-to-b from-[#1C1C24] to-[#121217] border border-[#2B2B3C] hover:border-[#E5A962]/50 transition-all shadow-card-emboss space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#252532] border border-[#353545] text-[#E5A962] flex items-center justify-center group-hover:bg-[#322618] group-hover:border-[#E5A962]/50 transition-colors">
                <card.icon className="w-5 h-5 text-[#E5A962]" />
              </div>
              <h3 className="font-bold font-display text-sm text-[#F3D9B5]">{card.title}</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[#20202C] text-center text-xs font-mono text-slate-500">
        AI Weather Truth Engine • Ministry of Earth Sciences & Disaster Management Operations Grid
      </footer>
    </div>
  );
};
