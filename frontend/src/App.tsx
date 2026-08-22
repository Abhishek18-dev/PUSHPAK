import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

import { Dashboard } from './pages/DashBoard';


/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const APP_PASSWORD = 'admin123';

/* -------------------------------------------------------------------------- */
/* Password Page                                                              */
/* -------------------------------------------------------------------------- */

function PasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError('');

    if (!password.trim()) {
      setError('Please enter the password.');
      return;
    }

    setIsLoading(true);

    // Small delay for a smoother transition.
    setTimeout(() => {
      if (password === APP_PASSWORD) {
        sessionStorage.setItem('rf_authenticated', 'true');

        // Navigate to the dashboard page.
        window.location.href = '/dashboard';
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-12 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">

      {/* Background Glow Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-64 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-72 -right-64 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.04),transparent_55%)]" />
      </div>

      {/* Password Card Container */}
      <div className="relative z-10 w-full max-w-lg mx-auto">

        {/* Logo / Header Section */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 w-18 h-18 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl shadow-indigo-950/40">
            <Sliders className="w-8 h-8 text-indigo-400" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            RF Spectrum Strategy
          </h1>

          <p className="mt-2.5 text-base text-slate-400">
            Test Harness & Verification Suite
          </p>
        </div>

        {/* Main Glass Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden">

          <div className="p-8 sm:p-10">

            {/* Inner Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800/60">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Secure Access
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Authentication required to launch
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              Enter your authorization password to continue securely to the RF Spectrum Strategy Test Harness dashboard.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label
                  htmlFor="app-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />

                  <input
                    id="app-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter password"
                    autoFocus
                    autoComplete="current-password"
                    disabled={isLoading}
                    className={`w-full h-12 rounded-xl bg-slate-950/70 border pl-11 pr-12 text-sm text-white placeholder:text-slate-600 outline-none transition-all shadow-inner ${error
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                        : 'border-slate-700/70 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                      }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={isLoading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mt-3.5 flex items-center gap-2.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-700/50 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-950/50 disabled:cursor-wait"
              >
                {isLoading ? 'Authenticating...' : 'Enter Dashboard'}
              </button>

            </form>

          </div>

          {/* Disclaimer Footer Inside Card */}
          <div className="px-8 py-5 border-t border-slate-800/80 bg-slate-950/40">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300 font-semibold">
                  Scope Disclaimer:
                </strong>{' '}
                Software simulation only. No connection to physical RF hardware.
              </p>
            </div>
          </div>

        </div>

        {/* Outer Footer Note */}
        <p className="text-center mt-8 text-xs text-slate-500 tracking-wide">
          Simulation-Only Prototype Verification Suite
        </p>

      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* App                                                                        */
/* -------------------------------------------------------------------------- */

export default function App() {
  const pathname = window.location.pathname;

  const isAuthenticated =
    sessionStorage.getItem('rf_authenticated') === 'true';

  if (pathname === '/') {
    return <PasswordPage />;
  }

  if (pathname === '/dashboard') {
    if (!isAuthenticated) {
      window.location.replace('/');
      return null;
    }

    return <Dashboard />;
  }

  window.location.replace('/');

  return null;
}