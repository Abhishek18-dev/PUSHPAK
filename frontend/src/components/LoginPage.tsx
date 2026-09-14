import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Particles } from './Particles';

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
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Interactive Tactical Defense Particles */}
      <Particles
        particleColors={['#22c55e', '#16a34a', '#4ade80', '#e2e8f0']}
        particleCount={70}
        speed={0.45}
        particleBaseSize={2.2}
        moveParticlesOnHover={true}
        className="opacity-70"
      />
      
      {/* Background Radar Aesthetics */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        {/* Concentric Radar Rings */}
        <div className="w-[800px] h-[800px] rounded-full -green-500/20 absolute" />
        <div className="w-[600px] h-[600px] rounded-full -green-500/30 -dashed absolute" />
        <div className="w-[400px] h-[400px] rounded-full -green-500/20 absolute" />
        <div className="w-[200px] h-[200px] rounded-full -green-500/30 -dashed absolute" />
        
        {/* Rotating Radar Sweep Line */}
        <div className="w-[800px] h-[800px] rounded-full absolute animate-radar-sweep pointer-events-none">
          <div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent to-green-500 absolute top-1/2 left-0 shadow-[0_0_15px_#22c55e]" />
        </div>
      </div>

      {/* Minimalist Defense System Login Card */}
      <div className="w-full max-w-sm liquid-glass-accent p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3.5 -green-500/20 pb-4">
          <div className="p-2.5 bg-green-500/15 -green-500/50 rounded-xl text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.35)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-tactical tracking-wider">
              PUSHPAK DEFENSE SOC
            </h1>
            <p className="text-[10px] font-mono text-green-400">
              CLASSIFIED RF INTELLIGENCE ACCESS
            </p>
          </div>
        </div>

        {/* Loading State or Password Form */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-5">
            <div className="w-10 h-10 -2 -green-500 -transparent rounded-full animate-spin shadow-[0_0_15px_#22c55e]"></div>
            
            <div className="text-center space-y-1">
              <p className="text-xs font-mono font-bold text-white tracking-wider">
                AUTHENTICATING CLEARANCE...
              </p>
              <p className="text-[10px] font-mono text-green-400 animate-pulse">
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
                  className={`w-full liquid-glass-tile py-3.5 px-4 text-center text-lg tracking-[0.4em] font-mono text-white placeholder-slate-500 focus:outline-none transition-all ${
                    error
                      ? '-rose-500 ring-2 ring-rose-500/30'
                      : 'focus:-green-500 focus:ring-2 focus:ring-green-500/30'
                  }`}
                />
              </div>

              {error && (
                <div className="pt-2 flex items-center justify-center text-[11px] font-mono text-rose-400 gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>INVALID PASSCODE (TRY: QWE@123)</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!password}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-400 hover:brightness-110 disabled:opacity-40 text-black font-mono font-extrabold text-xs rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.35)] disabled:cursor-not-allowed cursor-pointer"
            >
              <span>ACCESS COMMAND CENTER</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
