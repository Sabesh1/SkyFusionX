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
  const [evidenceCases, setEvidenceCases] = useState<ImageVerificationResult[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [result, setResult] = useState<ImageVerificationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  React.useEffect(() => {
    const fetchEvidence = async () => {
      setIsAnalyzing(true);
      const res = await aiApi.getVisualEvidence();
      setEvidenceCases(res);
      if (res.length > 0) {
        setActiveCaseId(res[0].id);
        setResult(res[0]);
      }
      setIsAnalyzing(false);
    };
    fetchEvidence();
  }, []);

  const handleSelectCase = async (id: string) => {
    setActiveCaseId(id);
    setIsAnalyzing(true);
    // Simulate short processing delay for UI effect
    setTimeout(() => {
      const selected = evidenceCases.find(c => c.id === id) || null;
      setResult(selected);
      setIsAnalyzing(false);
    }, 600);
  };

  const currentCase = evidenceCases.find(c => c.id === activeCaseId) || evidenceCases[0];

  return (
    <div className="space-y-6">
      {/* Test Case Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase text-theme-muted font-bold">Select Ground Evidence Case:</span>
          {evidenceCases.map(tc => (
            <button
              key={tc.id}
              onClick={() => handleSelectCase(tc.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCaseId === tc.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text'
              }`}
            >
              {tc.title.split(' ')[0]} ({tc.authenticityScore}% Trust)
            </button>
          ))}
          {evidenceCases.length === 0 && (
            <span className="text-xs font-mono text-theme-muted italic">No image reports found. Submit a report with an image to see it here.</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Sparkles className="w-4 h-4" />
          <span>Gemini Vision Integration</span>
        </div>
      </div>

      {/* Main Analyzer Grid */}
      {currentCase && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Canvas & CV Bounding Boxes */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-theme-bg shadow-2xl group">
            <img
              src={currentCase.url}
              alt="Visual Evidence"
              className="w-full h-80 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />

            {/* Simulated Computer Vision Overlays removed */}

            {/* Analysis Loading Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-cyan-400 space-y-2">
                <span className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="text-xs font-mono font-bold tracking-wider">
                  ANALYZING EVIDENCE WITH GEMINI VISION...
                </span>
              </div>
            )}

            {/* Bottom Floating Bar */}
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-theme-bg/90 border border-theme-border backdrop-blur-md flex items-center justify-between text-xs font-mono">
              <span className="text-theme-text flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                {result?.fileName || 'image_raw.jpg'}
              </span>
              <span className="text-emerald-400 font-bold">
                {result?.evidenceJson?.image_analyzed ? 'Visual Evidence Processed' : 'Image Analysis Bypassed/Failed'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface/60 border border-theme-border text-xs text-theme-muted leading-relaxed font-sans">
            <span className="font-mono text-cyan-400 font-bold uppercase mr-1.5">Forensic Note:</span>
            {result?.explanation}
          </div>
        </div>

        {/* Right Column: Forensics Breakdown & Authenticity Gauge */}
        <div className="lg:col-span-5 space-y-4">
          {result && (
            <>
              {/* Authenticity Score Card */}
              <div className="p-5 rounded-2xl bg-theme-card border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between border-b border-theme-border pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-mono uppercase font-bold text-theme-text">
                        Authenticity Score
                      </h4>
                      <span className="text-[10px] font-mono text-theme-muted">Tamper & Forensics Engine</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-2xl font-bold text-emerald-400">{result.authenticityScore}%</span>
                    <span className="text-xs text-theme-muted ml-0.5">/ 100</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                  <span className="text-theme-text">Forensics Verdict:</span>
                  <span className="text-emerald-400 font-bold">{result.status}</span>
                </div>

                {/* Multi-Point Correlation Checks */}
                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-theme-muted">AI Event Match ({result.detectedEvent}):</span>
                    <span className="text-cyan-400 font-bold">{result.aiConfidence}%</span>
                  </div>
                  {result.evidenceJson?.supporting?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-emerald-400 font-bold">Supporting Evidence:</span>
                      <ul className="list-disc pl-4 text-theme-muted mt-1 space-y-1">
                        {result.evidenceJson.supporting.map((point: string, idx: number) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.evidenceJson?.contradicting?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-amber-400 font-bold">Contradicting Evidence:</span>
                      <ul className="list-disc pl-4 text-theme-muted mt-1 space-y-1">
                        {result.evidenceJson.contradicting.map((point: string, idx: number) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
