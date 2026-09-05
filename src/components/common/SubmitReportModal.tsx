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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{name: string, state: string, lat: number, lng: number} | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [locationName, setLocationName] = useState('');
  const [eventType, setEventType] = useState<WeatherEventType>('Urban Flooding');
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [mediaUrl, setMediaUrl] = useState<string>('');

  // Multi-step verification animation state
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
        console.error("Location search failed", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  if (!isOpen) return null;

  const verificationStages = [
    { title: 'Geospatial Triangulation', desc: 'Validating GPS coordinate polygon & cell tower cluster...' },
    { title: 'AWS Rain Gauge Query', desc: 'Connecting to nearby Automatic Weather Station telemetry...' },
    { title: 'ISRO INSAT-3D Cross-Check', desc: 'Correlating thermal infrared cloud-top brightness...' },
    { title: 'Bayesian Fusion Synthesis', desc: 'Generating final multi-factor Trust Score...' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !locationName.trim()) return;
    
    // Require a location input
    if (!selectedLocation && !locationQuery.trim()) {
      addToast({ type: 'error', title: 'Location Required', message: 'Please enter a valid city or district.' });
      return;
    }

    soundFX.playRadarSweep();
    setIsVerifying(true);
    setVerifyStep(1); // Set to 1 just to show the processing UI

    try {
      // Use selected location or fallback to some defaults if user just typed manually without selecting
      let lat = selectedLocation?.lat || 13.0827;
      let lng = selectedLocation?.lng || 80.2707;
      let state = selectedLocation?.state || 'Unknown';
      let locCity = selectedLocation?.name || locationQuery.trim();

      const sevMap = { 'LOW': 1, 'MODERATE': 2, 'HIGH': 3, 'CRITICAL': 4 };
      const res = await reportApi.submitReport({
        source: 'Citizen App',
        content: `${locationName} - ${description}`,
        latitude: lat,
        longitude: lng,
        city: locCity,
        state: state,
        event_type: eventType,
        severity: sevMap[severity],
        media_url: mediaUrl || undefined
      });

      if (res && res.observation_id) {
        addToast({
          type: 'success',
          title: 'Report Submitted',
          message: `Report received. AI analysis in progress...`,
        });
        
        window.dispatchEvent(new CustomEvent('report_submitted', { detail: res.observation_id }));
        
        // We do not set verifiedReport to fake mock data. 
        // We just close the modal after a short delay so the user can see it on the Live stream.
        setTimeout(() => {
          handleReset();
        }, 1500);
      }
    } catch (e) {
       addToast({
          type: 'error',
          title: 'Report Failed',
          message: `Failed to submit report.`,
        });
       setIsVerifying(false);
    } finally {
      soundFX.playSuccess();
    }
  };

  const handleReset = () => {
    setVerifiedReport(null);
    setIsVerifying(false);
    setVerifyStep(0);
    setTitle('');
    setDescription('');
    setMediaUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0D121F] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#090D17] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Submit Ground Weather Signal
              </h3>
              <p className="text-[10px] font-mono text-cyan-400">
                Direct Ingestion to AI Weather Truth Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
                  <label className="text-xs font-mono text-slate-400">City / District</label>
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={e => {
                      setLocationQuery(e.target.value);
                      setSelectedLocation(null);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search Indian city or district..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 outline-none font-mono"
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-8 w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
                      {locationSuggestions.map(loc => (
                        <div
                          key={`${loc.name}-${loc.state}`}
                          className="px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-cyan-400 cursor-pointer font-mono"
                          onClick={() => {
                            setSelectedLocation({ name: loc.name, state: loc.state, lat: loc.latitude, lng: loc.longitude });
                            setLocationQuery(`${loc.name}, ${loc.state}`);
                            setShowSuggestions(false);
                          }}
                        >
                          {loc.name}, {loc.state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Exact Landmark / Road</label>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={e => setLocationName(e.target.value)}
                    placeholder="e.g. Velachery 100ft road, Tambaram"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Hazard Event Type</label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as WeatherEventType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 outline-none font-mono"
                  >
                    <option value="Urban Flooding">Urban Flooding</option>
                    <option value="Heavy Rainfall">Heavy Rainfall</option>
                    <option value="Thunderstorm">Thunderstorm</option>
                    <option value="Cyclone">Cyclone / Gale Winds</option>
                    <option value="Dust Storm">Dust Storm</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Observed Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 outline-none font-mono"
                  >
                    <option value="HIGH">High (Road blocked / severe rain)</option>
                    <option value="CRITICAL">Critical (Life-safety danger / &gt;3ft flood)</option>
                    <option value="MODERATE">Moderate (Traffic slowdown)</option>
                    <option value="LOW">Low (Light showers)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">
                  Ground Report Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe ground observations (e.g. Water level rising above 3ft, cars stranded, continuous thunder)..."
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">
                  Optional: Attach Photo Evidence
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center justify-center w-full max-w-[200px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-xs text-slate-300 font-mono transition-colors">
                    <Camera className="w-4 h-4 mr-2" />
                    <span>Select Image</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setMediaUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {mediaUrl && (
                    <div className="relative">
                      <img src={mediaUrl} alt="Evidence" className="h-10 w-10 object-cover rounded border border-slate-700" />
                      <button 
                        type="button" 
                        onClick={() => setMediaUrl('')}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full text-white p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Auto-validated via Bayesian Truth Engine
                </span>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit & Trigger AI Verification</span>
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
                <p className="text-xs text-slate-400 font-mono">
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
                        : 'bg-slate-900/40 border-slate-800 text-slate-600'
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
                  <span>TRUST SCORE: 92% (VERIFIED)</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 font-display mt-2">
                  Report Successfully Ingested into National Grid
                </h3>
                <p className="text-xs text-slate-300 font-sans max-w-md mx-auto leading-relaxed">
                  {verifiedReport.aiExplanation}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-md hover:bg-cyan-400 transition-all"
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
