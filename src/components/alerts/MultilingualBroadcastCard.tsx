import React, { useState } from 'react';
import { WeatherAlert } from '../../types/alert';
import { SupportedLanguage } from '../../types/common';
import { SeverityBadge } from '../common/SeverityBadge';
import { soundFX } from '../../utils/soundEffects';
import {
  Globe,
  Radio,
  Send,
  Volume2,
  CheckCircle2,
  Smartphone,
  ShieldAlert,
  Share2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MultilingualBroadcastCard: React.FC<{ alert: WeatherAlert }> = ({ alert }) => {
  const { language, setLanguage, addToast } = useApp();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(language);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const langTabs: { code: SupportedLanguage; label: string; native: string; voiceLang: string }[] = [
    { code: 'en', label: 'English', native: 'English', voiceLang: 'en-IN' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்', voiceLang: 'ta-IN' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी', voiceLang: 'hi-IN' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు', voiceLang: 'te-IN' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', voiceLang: 'kn-IN' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം', voiceLang: 'ml-IN' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা', voiceLang: 'bn-IN' },
    { code: 'mr', label: 'Marathi', native: 'मराठी', voiceLang: 'mr-IN' },
  ];

  const currentMessage = alert.message[selectedLang] || alert.message.en;
  const currentTab = langTabs.find(t => t.code === selectedLang) || langTabs[0];

  const handleSimulateAudio = () => {
    soundFX.playRadarSweep();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentMessage);
      utterance.lang = currentTab.voiceLang || 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }

    addToast({
      type: 'info',
      title: 'Synthesized Voice Broadcast',
      message: `Playing audio alert readout in ${selectedLang.toUpperCase()} for emergency sirens & mobile alerts.`,
    });
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const handleDispatch = () => {
    soundFX.playCriticalAlert();
    addToast({
      type: 'success',
      title: 'Multilingual Alert Dispatched',
      message: `Broadcast transmitted across 5 public channels to ${alert.affectedPopulation}.`,
    });
  };

  return (
    <div className="p-6 rounded-2xl bg-command-card border border-cyan-500/30 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={alert.severity} size="sm" />
            <span className="font-mono text-xs text-cyan-400 font-bold">{alert.id}</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 font-display mt-1">
            {alert.title}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Target Region: {alert.affectedRegion} • {alert.affectedPopulation}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPlayingAudio ? (
            <button
              onClick={handleStopAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-slate-950 border border-red-400 text-xs font-mono font-bold transition-all animate-pulse"
            >
              <VolumeX className="w-4 h-4" />
              <span>STOP AUDIO</span>
            </button>
          ) : (
            <button
              onClick={handleSimulateAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 text-xs font-mono transition-all"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>TEST AUDIO TTS</span>
            </button>
          )}

          <button
            onClick={handleDispatch}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>DISPATCH NOW</span>
          </button>
        </div>
      </div>

      {/* Language Switcher Ribbon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Switch Language Preview (Instant AI Translation)
          </span>
          <span className="text-[10px] font-mono text-cyan-400">8 Indian Languages Active</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {langTabs.map(tab => (
            <button
              key={tab.code}
              onClick={() => {
                soundFX.playClick();
                setSelectedLang(tab.code);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans whitespace-nowrap transition-all ${
                selectedLang === tab.code
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.native} <span className="font-mono text-[10px] opacity-75">({tab.label})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Broadcast Message Box */}
      <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 relative">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-500 border-b border-slate-800 pb-2 mb-2">
          <span>SMS / Cell Broadcast Body ({selectedLang.toUpperCase()})</span>
          <span className="text-cyan-400 font-bold">CAP v1.2 Protocol Compliant</span>
        </div>
        <p className="text-base text-slate-100 font-medium leading-relaxed font-sans">
          "{currentMessage}"
        </p>
      </div>

      {/* Multichannel Distribution Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-500">SMS Gateway</div>
            <div className="text-slate-200 font-bold">Active (100k/s)</div>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-500">Cell Broadcast</div>
            <div className="text-emerald-400 font-bold">Geo-Fenced</div>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <div>
            <div className="text-[10px] text-slate-500">NDRF Dispatch</div>
            <div className="text-red-400 font-bold">Hotlink Online</div>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-[10px] text-slate-500">Civic Sirens</div>
            <div className="text-slate-200 font-bold">14 Stations</div>
          </div>
        </div>
      </div>
    </div>
  );
};
