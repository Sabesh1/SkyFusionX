import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { reportApi } from '../../services/reportApi';
import { apiClient } from '../../services/apiClient';
import { WeatherReport } from '../../types/report';
import { WeatherEventType, SeverityLevel } from '../../types/common';
import { soundFX } from '../../utils/soundEffects';
import {
  X,
  Send,
  MapPin,
  Camera,
  Radio,
  Satellite,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertTriangle,
} from 'lucide-react';

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useApp();
  const { liveReports } = useDemoMode();

  const [description, setDescription] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; state: string; district?: string; lat: number; lng: number } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [eventType, setEventType] = useState<WeatherEventType>('Urban Flooding');
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [selectedImageName, setSelectedImageName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationTimestamp, setLocationTimestamp] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifiedReport, setVerifiedReport] = useState<WeatherReport | null>(null);

  useEffect(() => {
    if (!locationQuery || locationQuery.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await apiClient.get<any[]>(`/api/v1/locations/search?q=${encodeURIComponent(locationQuery)}`);
        setLocationSuggestions(res || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Location search failed', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  if (!isOpen) return null;

  const verificationStages = [
    { title: 'Processing Report', desc: 'Uploading to National Grid...' },
    { title: 'AI Fusion Engine', desc: 'Analyzing evidence via Gemini Multimodal & generating Truth Score...' },
  ];

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedLocation && locationQuery.trim().length < 2) {
      nextErrors.location = 'Choose a valid city or district.';
    }
    if (locationName.trim().length < 3) {
      nextErrors.landmark = 'Landmark / road must be at least 3 characters.';
    }
    if (description.trim().length < 10) {
      nextErrors.description = 'Description must be at least 10 characters.';
    }
    if (description.trim().length > 1000) {
      nextErrors.description = 'Description must be 1000 characters or less.';
    }
    if (!severity) {
      nextErrors.severity = 'Select an observed severity.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const safeLocation = selectedLocation ?? {
      name: locationQuery.trim(),
      district: locationQuery.trim(),
      state: 'Unknown',
      lat: 13.0827,
      lng: 80.2707,
    };

    setIsSubmitting(true);
    soundFX.playRadarSweep();
    setIsVerifying(true);
    setVerifyStep(1);

    try {
      const sevMap: Record<SeverityLevel, number> = {
        LOW: 1,
        MODERATE: 2,
        HIGH: 3,
        CRITICAL: 4,
      };

      const res = await reportApi.submitReport({
        source: 'Citizen App',
        content: `${locationName} - ${description}`,
        latitude: safeLocation.lat,
        longitude: safeLocation.lng,
        city: safeLocation.name,
        district: safeLocation.district || safeLocation.name,
        state: safeLocation.state || 'Unknown',
        event_type: eventType,
        severity: sevMap[severity],
        media_url: mediaUrl || undefined,
        raw_payload: {
          event_type: eventType,
          severity,
          city: safeLocation.name,
          district: safeLocation.district || safeLocation.name,
          state: safeLocation.state || 'Unknown',
          landmark: locationName,
          description,
          location_accuracy: locationAccuracy || undefined,
          location_captured_at: locationTimestamp ? new Date(locationTimestamp).toISOString() : undefined,
        },
      });

      if (res && res.observation_id) {
        addToast({
          type: 'info',
          title: 'ANALYZING',
          message: 'Report received. AI evidence analysis in progress...',
        });
        
        // Dispatch event immediately so Live Intel shows PROCESSING state
        window.dispatchEvent(new CustomEvent('report_submitted', { detail: res.observation_id }));
        
        // Poll for processing completion for the modal's own UI
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const updated = await reportApi.getReportById(res.observation_id);
            if (updated && updated.status !== 'PROCESSING') {
              clearInterval(pollInterval);
              setVerifyStep(1); // Advance to final step UI
              setIsVerifying(false);
              setVerifiedReport(updated);
            }
          } catch (e) {
            console.error("Polling error", e);
          }
          
          if (attempts > 30) {
            clearInterval(pollInterval); // Timeout after 60s
            setIsVerifying(false);
            handleReset();
            addToast({ type: 'warning', title: 'Timeout', message: 'Analysis is taking too long. Check the live stream later.' });
          }
        }, 2000);
        return;
      }

      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'We could not submit the report right now. Please try again.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'The report service is unavailable. Please retry in a moment.',
      });
    } finally {
      setIsSubmitting(false);
      setIsVerifying(false);
      soundFX.playSuccess();
    }
  };

  const handleReset = () => {
    setVerifiedReport(null);
    setIsVerifying(false);
    setVerifyStep(0);
    setDescription('');
    setLocationQuery('');
    setLocationName('');
    setSelectedLocation(null);
    setMediaUrl('');
    setSelectedImageName('');
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-theme-card border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-theme-surface border-b border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-text font-display">
                Submit Ground Weather Signal
              </h3>
              <p className="text-[10px] font-mono text-cyan-400">
                Direct Ingestion to AI Weather Truth Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {!isVerifying && !verifiedReport && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-theme-muted">City / District</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          addToast({ type: 'error', title: 'Error', message: 'Geolocation is not supported by your browser' });
                          return;
                        }
                        setIsGettingLocation(true);
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setIsGettingLocation(false);
                            setSelectedLocation({
                              name: 'Current Location',
                              state: 'Unknown',
                              lat: pos.coords.latitude,
                              lng: pos.coords.longitude,
                            });
                            setLocationQuery('Current Location');
                            setLocationAccuracy(pos.coords.accuracy);
                            setLocationTimestamp(pos.timestamp);
                            addToast({ type: 'success', title: 'Location Found', message: `Accuracy: ±${Math.round(pos.coords.accuracy)}m` });
                          },
                          (err) => {
                            setIsGettingLocation(false);
                            addToast({ type: 'error', title: 'Location Error', message: err.message });
                          },
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                      }}
                      disabled={isGettingLocation}
                      className="text-[10px] flex items-center gap-1 font-mono text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                    >
                      <MapPin className="w-3 h-3" />
                      {isGettingLocation ? 'Locating...' : 'Use My Location'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={e => {
                      setLocationQuery(e.target.value);
                      setSelectedLocation(null);
                      if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search Indian city or district..."
                    className={`w-full px-3 py-2 rounded-lg bg-theme-surface border text-xs text-theme-text outline-none font-mono ${errors.location ? 'border-red-500' : 'border-theme-border focus:border-cyan-500'}`}
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-8 w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-theme-card border border-theme-border-hover rounded-lg shadow-lg overflow-hidden">
                      {locationSuggestions.map(loc => (
                        <div
                          key={`${loc.name}-${loc.state}`}
                          className="px-3 py-2 text-xs text-theme-text hover:bg-slate-700 hover:text-cyan-400 cursor-pointer font-mono"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedLocation({
                              name: loc.name,
                              district: loc.district || loc.name,
                              state: loc.state,
                              lat: loc.latitude,
                              lng: loc.longitude,
                            });
                            setLocationQuery(`${loc.name}, ${loc.state}`);
                            setShowSuggestions(false);
                            setErrors(prev => ({ ...prev, location: '' }));
                          }}
                        >
                          {loc.name}, {loc.state}
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.location && <p className="text-[10px] text-red-400 font-mono">{errors.location}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-theme-muted">Exact Landmark / Road</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={e => {
                      setLocationName(e.target.value);
                      if (errors.landmark) setErrors(prev => ({ ...prev, landmark: '' }));
                    }}
                    placeholder="e.g. Velachery 100ft road, Tambaram"
                    className={`w-full px-3 py-2 rounded-lg bg-theme-surface border text-xs text-theme-text outline-none ${errors.landmark ? 'border-red-500' : 'border-theme-border focus:border-cyan-500'}`}
                  />
                  {errors.landmark && <p className="text-[10px] text-red-400 font-mono">{errors.landmark}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-theme-muted">Hazard Event Type</label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as WeatherEventType)}
                    className="w-full px-3 py-2 rounded-lg bg-theme-surface border border-theme-border focus:border-cyan-500 text-xs text-theme-text outline-none font-mono"
                  >
                    <option value="Urban Flooding">Urban Flooding</option>
                    <option value="Heavy Rainfall">Heavy Rainfall</option>
                    <option value="Thunderstorm">Thunderstorm</option>
                    <option value="Cyclone">Cyclone / Gale Winds</option>
                    <option value="Dust Storm">Dust Storm</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-theme-muted">Observed Severity</label>
                  <select
                    value={severity}
                    onChange={e => {
                      setSeverity(e.target.value as SeverityLevel);
                      if (errors.severity) setErrors(prev => ({ ...prev, severity: '' }));
                    }}
                    className={`w-full px-3 py-2 rounded-lg bg-theme-surface border text-xs text-theme-text outline-none font-mono ${errors.severity ? 'border-red-500' : 'border-theme-border focus:border-cyan-500'}`}
                  >
                    <option value="HIGH">High (Road blocked / severe rain)</option>
                    <option value="CRITICAL">Critical (Life-safety danger / &gt;3ft flood)</option>
                    <option value="MODERATE">Moderate (Traffic slowdown)</option>
                    <option value="LOW">Low (Light showers)</option>
                  </select>
                  {errors.severity && <p className="text-[10px] text-red-400 font-mono">{errors.severity}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-theme-muted">
                  Ground Report Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                  }}
                  placeholder="Describe ground observations (e.g. Water level rising above 3ft, cars stranded, continuous thunder)..."
                  className={`w-full px-3 py-2.5 rounded-lg bg-theme-surface border text-xs text-theme-text outline-none font-sans ${errors.description ? 'border-red-500' : 'border-theme-border focus:border-cyan-500'}`}
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-theme-muted">
                  <span>{description.trim().length}/1000 characters</span>
                  {errors.description && <span className="text-red-400">{errors.description}</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-theme-muted">
                  Optional: Attach Photo Evidence
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center justify-center w-full max-w-[220px] px-3 py-2 rounded-lg bg-theme-surface border border-theme-border hover:border-cyan-500 text-xs text-theme-text font-mono transition-colors">
                    <Camera className="w-4 h-4 mr-2" />
                    <span>{selectedImageName || 'Select Image'}</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSelectedImageName(file.name);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setMediaUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {mediaUrl && (
                    <div className="relative">
                      <img src={mediaUrl} alt="Evidence" className="h-10 w-10 object-cover rounded border border-theme-border-hover" />
                      <button 
                        type="button" 
                        onClick={() => {
                          setMediaUrl('');
                          setSelectedImageName('');
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full text-theme-text p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-theme-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-theme-muted">
                  Auto-validated via Bayesian Truth Engine
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit & Trigger AI Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Multi-Step Verification Animation */}
          {isVerifying && (
            <div className="py-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold font-mono text-cyan-300 uppercase tracking-wider">
                  AI Multi-Factor Pipeline Running...
                </h4>
                <p className="text-xs text-theme-muted font-mono">
                  {verificationStages[verifyStep]?.title} — {verificationStages[verifyStep]?.desc}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-4">
                {verificationStages.map((stage, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-[10px] font-mono transition-all ${
                      idx <= verifyStep
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-theme-surface/40 border-theme-border text-slate-600'
                    }`}
                  >
                    Stage {idx + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Result State */}
          {verifiedReport && (
            <div className="space-y-5 text-center py-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                  <span>TRUST SCORE: {verifiedReport.trustScore}% ({verifiedReport.status})</span>
                </div>
                <h3 className="text-base font-bold text-theme-text font-display mt-2">
                  Report Successfully Ingested into National Grid
                </h3>
                <p className="text-xs text-theme-text font-sans max-w-md mx-auto leading-relaxed mt-2 p-2 bg-theme-surface border border-theme-border-hover rounded-lg">
                  <span className="font-bold block mb-1">AI Evidence Assessment:</span>
                  {verifiedReport.geminiEvidence?.assessment || 'No AI assessment available.'}
                </p>
                {verifiedReport.imageAnalyzed && (
                  <p className="text-[10px] text-cyan-400 font-mono mt-2 flex items-center justify-center gap-1">
                    <Camera className="w-3 h-3" /> Image analyzed successfully
                  </p>
                )}
              </div>

              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-white font-bold text-xs font-mono shadow-md hover:bg-cyan-400 transition-all"
              >
                Close & Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
