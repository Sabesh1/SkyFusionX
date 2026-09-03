import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const [operatorId, setOperatorId] = useState('admin');
  const [passcode, setPasscode] = useState('password');
  const navigate = useNavigate();
  const { addToast } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', operatorId);
      formData.append('password', passcode);
      
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        
        soundFX.playSuccess();
        addToast({
          type: 'success',
          title: 'Authenticated Successfully',
          message: 'Command center access granted.',
        });
        navigate('/dashboard');
      } else {
        addToast({
          type: 'error',
          title: 'Authentication Failed',
          message: 'Invalid credentials. Please try again.',
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to the authentication server.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E12] text-[#EEEEF2] flex items-center justify-center p-4 selection:bg-[#E5A962] selection:text-slate-950">
      <div className="w-full max-w-md p-8 rounded-3xl bg-gradient-to-b from-[#1C1C24] to-[#121217] border border-[#2B2B3C] shadow-card-emboss space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E5A962] via-[#D49547] to-[#8C5E28] flex items-center justify-center text-slate-950 mx-auto shadow-gold-glow">
            <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-[#EEEEF2]">
              Operator Authentication
            </h2>
            <p className="text-xs font-mono text-[#E5A962] mt-0.5">
              National Disaster Surveillance Access
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400">Officer / Station ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={operatorId}
                onChange={e => setOperatorId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#181822] border border-[#2B2B3C] focus:border-[#E5A962] text-slate-200 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400">Security Passcode</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#181822] border border-[#2B2B3C] focus:border-[#E5A962] text-slate-200 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#1D1B14] border border-[#E5A962]/30 text-[11px] text-[#F3C58E] font-sans flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E5A962] shrink-0" />
            <span>Demo Mode Enabled: Click below to sign in instantly with test credentials.</span>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#E5A962] via-[#D49547] to-[#B37B34] text-slate-950 font-bold text-xs font-mono shadow-gold-glow hover:scale-[1.02] transition-all"
          >
            <span>Authorize & Enter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
