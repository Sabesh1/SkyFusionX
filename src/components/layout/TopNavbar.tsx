import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { SupportedLanguage } from '../../types/common';
import { SubmitReportModal } from '../common/SubmitReportModal';
import { soundFX } from '../../utils/soundEffects';
import { apiClient } from '../../services/apiClient';
import {
  Search,
  Bell,
  Globe,
  Clock,
  Play,
  RotateCw,
  PlusCircle,
  ShieldCheck,
  Server,
  Sun,
  Moon,
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { language, setLanguage, setIsSearchOpen, refreshData, lastSyncTime, theme, setTheme } = useApp();
  const { isDemoMode, toggleDemoMode, startTour, isTourActive } = useDemoMode();
  const [timeString, setTimeString] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await apiClient.checkHealth();
      setBackendOnline(isOnline);
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const languages: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'EN' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <>
      <header className="h-16 px-6 bg-theme-surface border-b border-theme-border/80 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left: Global Search Pill & Backend Status */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={() => {
              soundFX.playClick();
              setIsSearchOpen(true);
            }}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-theme-card border border-theme-border/80 hover:border-theme-border-hover text-theme-muted text-xs transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-theme-muted" />
              <span className="font-sans">Search incidents, stations, cities...</span>
            </div>
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-theme-surface text-[10px] font-mono text-theme-muted border border-theme-border-hover">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Section: Backend Badge, Time, Lang, Tour, Profile */}
        <div className="flex items-center gap-3">
          {/* Live FastAPI Backend Connection Indicator */}
          <button
            onClick={async () => {
              soundFX.playClick();
              const isOnline = await apiClient.checkHealth();
              setBackendOnline(isOnline);
            }}
            title={backendOnline ? 'FastAPI Backend Online at :8000' : 'Click to test FastAPI connection'}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border transition-all ${
              backendOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{backendOnline ? 'FastAPI :8000' : 'Hybrid Engine'}</span>
          </button>

          {/* Submit Signal Quick Action */}
          <button
            onClick={() => {
              soundFX.playClick();
              setIsSubmitModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-medium transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Signal</span>
          </button>

          {/* 3-Min Tour Button */}
          <button
            onClick={() => {
              soundFX.playRadarSweep();
              startTour();
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
              isTourActive
                ? 'bg-purple-600 text-theme-text border-purple-400'
                : 'bg-purple-950/30 border-purple-500/30 text-purple-300 hover:bg-purple-900/40'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Judge Tour</span>
          </button>

          {/* IST Time */}
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs text-theme-text px-3 py-1.5 rounded-xl bg-theme-card border border-theme-border/80">
            <Clock className="w-3.5 h-3.5 text-theme-muted" />
            <span>{timeString} IST</span>
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                soundFX.playClick();
                setShowLangMenu(!showLangMenu);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-card border border-theme-border/80 text-xs font-medium text-theme-text hover:border-theme-border-hover transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-theme-muted" />
              <span>{currentLang.native}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-theme-card border border-theme-border rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      soundFX.playClick();
                      setLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-theme-surface transition-colors ${
                      language === lang.code ? 'text-cyan-400 font-semibold' : 'text-theme-text'
                    }`}
                  >
                    <span>{lang.label} ({lang.native})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              soundFX.playClick();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
            className="p-2 rounded-xl bg-theme-card border border-theme-border/80 hover:border-theme-border-hover text-theme-text transition-colors"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark AMOLED Theme'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-theme-muted" />
            ) : (
              <Moon className="w-4 h-4 text-theme-muted" />
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => {
              soundFX.playClick();
              setShowNotifMenu(!showNotifMenu);
            }}
            className="relative p-2 rounded-xl bg-theme-card border border-theme-border/80 hover:border-theme-border-hover text-theme-text transition-colors"
          >
            <Bell className="w-4 h-4 text-theme-muted" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              4
            </span>
          </button>

          {/* Operator Avatar */}
          <div className="w-8 h-8 rounded-xl bg-theme-card border border-theme-border/80 flex items-center justify-center text-theme-text text-xs font-mono font-bold">
            ND
          </div>
        </div>
      </header>

      {/* Ground Report Modal */}
      <SubmitReportModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
    </>
  );
};
