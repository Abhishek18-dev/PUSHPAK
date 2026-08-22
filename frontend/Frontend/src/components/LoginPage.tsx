import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onUnlock: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (password === 'QWE@123') {
      setError(false);
      setIsLoading(true);
      setCountdown(3);
    } else {
      setError(true);
    }
  };

  // 3-second countdown timer when authenticating
  useEffect(() => {
    let timer: any = null;
    if (isLoading) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onUnlock();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, onUnlock]);

  return (
    <div className="min-h-screen bg-[#04080e] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      
      {/* Background Radar Aesthetics */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
        {/* Concentric Radar Rings */}
        <div className="w-[800px] h-[800px] rounded-full border border-[#00d2c4]/20 absolute" />
        <div className="w-[600px] h-[600px] rounded-full border border-[#00d2c4]/30 border-dashed absolute" />
        <div className="w-[400px] h-[400px] rounded-full border border-[#00d2c4]/20 absolute" />
        <div className="w-[200px] h-[200px] rounded-full border border-[#00d2c4]/30 border-dashed absolute" />
        
        {/* Rotating Radar Sweep Line */}
        <div className="w-[800px] h-[800px] rounded-full absolute animate-radar-sweep pointer-events-none">
          <div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent to-[#00d2c4] absolute top-1/2 left-0 shadow-[0_0_15px_#00d2c4]" />
        </div>
      </div>

      {/* Minimalist Defense System Login Card */}
      <div className="w-full max-w-sm glass-soc-card border border-slate-800 rounded-2xl p-7 shadow-2xl relative z-10 space-y-6">
        
        {/* Simple Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#00d2c4]/10 border border-[#00d2c4]/40 rounded-xl text-[#00d2c4] glow-teal">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 font-mono tracking-wider">
              DEFENSE SYSTEM LOGIN
            </h1>
            <p className="text-[11px] font-mono text-slate-500">
              CLASSIFIED ACCESS
            </p>
          </div>
        </div>

        {/* Loading State or Password Form */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-5">
            {/* User Provided Custom Loader */}
            <div className="loader"></div>
            
            <div className="text-center space-y-1">
              <p className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                AUTHENTICATING CLEARANCE...
              </p>
              <p className="text-[10px] font-mono text-[#00d2c4] animate-pulse">
                INITIALIZING COMMAND CENTER ({countdown}s)
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="••••••••••••"
                  autoFocus
                  className={`w-full bg-[#07101b] border rounded-xl py-3 px-4 text-center text-lg tracking-[0.4em] font-mono text-slate-100 placeholder-slate-600 focus:outline-none transition-all ${
                    error
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-800 focus:border-[#00d2c4] focus:ring-2 focus:ring-[#00d2c4]/20'
                  }`}
                />
              </div>

              {error && (
                <div className="pt-2 flex items-center justify-center text-[11px] font-mono text-rose-400 gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>INVALID PASSCODE</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!password}
              className="w-full py-3 bg-[#00d2c4] hover:bg-cyan-400 disabled:opacity-40 text-black font-mono font-bold text-xs rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg glow-teal disabled:cursor-not-allowed"
            >
              <span>ACCESS SYSTEM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
