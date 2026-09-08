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
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col justify-between selection:bg-theme-primary selection:text-white font-sans">
      {/* Top Floating Navigation Pill */}
      <header className="px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-theme-primary to-theme-primary-hover flex items-center justify-center text-white shadow-primary-glow">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-theme-text">
              AI Weather Truth Engine
            </span>
            <span className="block text-[10px] font-mono text-theme-primary tracking-wider uppercase font-semibold">
              National Big Data Analytics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-full bg-theme-surface hover:bg-theme-surface/80 border border-theme-border text-xs font-mono text-theme-text transition-colors"
          >
            Operator Sign In
          </button>
          <button
            onClick={handleLaunch}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-theme-primary to-theme-primary-hover hover:brightness-110 text-white text-xs font-mono font-bold transition-all shadow-primary-glow"
          >
            <span>Enter Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-6 py-16 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-theme-primary/10 border border-theme-primary/50 text-theme-primary text-xs font-mono font-semibold shadow-primary-sm animate-fadeIn">
          <Sparkles className="w-4 h-4 text-theme-primary" />
          <span>Real-Time Weather Intelligence for a Safer India</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-theme-text leading-[1.1]">
          Incontrovertible Truth in <br />
          <span className="bg-gradient-to-r from-theme-secondary to-theme-primary bg-clip-text text-transparent">
            Extreme Weather Crises
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-theme-muted font-sans max-w-2xl mx-auto leading-relaxed">
          National disaster surveillance command center bridging citizen ground observations with ISRO satellites, Doppler radars, and Bayesian truth algorithms.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleLaunch}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-theme-primary to-theme-primary-hover text-white font-bold text-sm font-mono shadow-primary-glow hover:scale-105 transition-all"
          >
            <span>Launch Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/truth-engine')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-theme-surface hover:bg-theme-surface/80 border border-theme-border text-theme-text text-sm font-mono transition-all"
          >
            <span>Inspect Truth Engine</span>
            <ChevronRight className="w-4 h-4 text-theme-primary" />
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 text-left">
          {featureCards.map((card, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-theme-card border border-theme-border hover:border-theme-primary/50 transition-all shadow-card-emboss space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-theme-surface border border-theme-border-hover text-theme-primary flex items-center justify-center group-hover:bg-theme-primary/10 group-hover:border-theme-primary/50 transition-colors">
                <card.icon className="w-5 h-5 text-theme-primary" />
              </div>
              <h3 className="font-bold font-display text-sm text-theme-text-secondary">{card.title}</h3>
              <p className="text-xs text-theme-muted font-sans leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-theme-border/80 text-center text-xs font-mono text-theme-muted">
        AI Weather Truth Engine • Ministry of Earth Sciences & Disaster Management Operations Grid
      </footer>
    </div>
  );
};
