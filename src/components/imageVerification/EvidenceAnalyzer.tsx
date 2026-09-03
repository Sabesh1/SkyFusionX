import React, { useState } from 'react';
import { aiApi, ImageVerificationResult } from '../../services/aiApi';
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  FileCheck2,
} from 'lucide-react';

export const EvidenceAnalyzer: React.FC = () => {
  const [activeCase, setActiveCase] = useState<'chennai' | 'mumbai' | 'delhi'>('chennai');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageVerificationResult | null>(null);

  const testCases = [
    {
      id: 'chennai',
      title: 'Chennai Velachery Flood Waterlogging',
      url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
      tag: 'Authentic 94%',
    },
    {
      id: 'mumbai',
      title: 'Mumbai Kurla Rail Tracks Submerged',
      url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
      tag: 'Authentic 96%',
    },
    {
      id: 'delhi',
      title: 'Delhi-NCR Expressway Dust Squall',
      url: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=80',
      tag: 'Authentic 91%',
    },
  ];

  const handleSelectCase = async (caseId: 'chennai' | 'mumbai' | 'delhi') => {
    setActiveCase(caseId);
    setIsAnalyzing(true);
    setTimeout(async () => {
      const res = await aiApi.verifyImage(caseId);
      setResult(res);
      setIsAnalyzing(false);
    }, 600);
  };

  // Initial load
  React.useEffect(() => {
    handleSelectCase('chennai');
  }, []);

  const currentCase = testCases.find(c => c.id === activeCase) || testCases[0];

  return (
    <div className="space-y-6">
      {/* Test Case Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-500 font-bold">Select Ground Evidence Case:</span>
          {testCases.map(tc => (
            <button
              key={tc.id}
              onClick={() => handleSelectCase(tc.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCase === tc.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tc.title.split(' ')[0]} ({tc.tag})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Sparkles className="w-4 h-4" />
          <span>AI Computer Vision Engine v4.8</span>
        </div>
      </div>

      {/* Main Analyzer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Canvas & CV Bounding Boxes */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-2xl group">
            <img
              src={currentCase.url}
              alt="Visual Evidence"
              className="w-full h-80 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />

            {/* Simulated Computer Vision Overlays */}
            {result && !isAnalyzing && (
              <>
                {result.cvDetections.map((box, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${box.box[0]}%`,
                      top: `${box.box[1]}%`,
                      width: `${box.box[2]}%`,
                      height: `${box.box[3]}%`,
                    }}
                    className="absolute border-2 border-cyan-400/80 bg-cyan-500/15 rounded pointer-events-none animate-fadeIn"
                  >
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-cyan-950 text-[10px] font-mono text-cyan-300 border border-cyan-500 font-bold whitespace-nowrap">
                      {box.label} ({box.confidence}%)
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Analysis Loading Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-cyan-400 space-y-2">
                <span className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="text-xs font-mono font-bold tracking-wider">
                  SCANNING EXIF HEADERS & CV DETECTIONS...
                </span>
              </div>
            )}

            {/* Bottom Floating Bar */}
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                {result?.fileName || 'image_raw.jpg'}
              </span>
              <span className="text-emerald-400 font-bold">
                {result?.cvDetections.length || 2} Object Boundaries Identified
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed font-sans">
            <span className="font-mono text-cyan-400 font-bold uppercase mr-1.5">Forensic Note:</span>
            {result?.explanation}
          </div>
        </div>

        {/* Right Column: Forensics Breakdown & Authenticity Gauge */}
        <div className="lg:col-span-5 space-y-4">
          {result && (
            <>
              {/* Authenticity Score Card */}
              <div className="p-5 rounded-2xl bg-command-card border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-mono uppercase font-bold text-slate-100">
                        Authenticity Score
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">Tamper & Forensics Engine</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-2xl font-bold text-emerald-400">{result.authenticityScore}%</span>
                    <span className="text-xs text-slate-500 ml-0.5">/ 100</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Forensics Verdict:</span>
                  <span className="text-emerald-400 font-bold">{result.status}</span>
                </div>

                {/* Multi-Point Correlation Checks */}
                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">CV Event Match ({result.detectedEvent}):</span>
                    <span className="text-cyan-400 font-bold">{result.aiConfidence}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">EXIF GPS vs Claimed Zone:</span>
                    <span className="text-emerald-400 font-bold">{result.locationMatch}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Timestamp Validity:</span>
                    <span className="text-cyan-400 font-bold">{result.timestampMatch}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Weather Telemetry Correlation:</span>
                    <span className="text-emerald-400 font-bold">{result.weatherCorrelation}%</span>
                  </div>
                </div>
              </div>

              {/* Hardware EXIF Metadata Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
                  Hardware Sensor & EXIF Headers
                </div>
                <div className="space-y-1.5 text-slate-300 text-[11px]">
                  <div>Device: <span className="text-slate-100">{result.exifDetails.cameraModel}</span></div>
                  <div>GPS: <span className="text-cyan-400">{result.exifDetails.gpsCoordinates}</span></div>
                  <div>Captured: <span className="text-slate-100">{result.exifDetails.captureTimestamp}</span></div>
                  <div>Software: <span className="text-slate-400">{result.exifDetails.softwareUsed}</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
