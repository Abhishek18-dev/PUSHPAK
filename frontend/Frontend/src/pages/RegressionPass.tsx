import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  ShieldCheck, 
  Radio, 
  FileCode, 
  Terminal, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pending' | 'success' | 'failed';
  details?: string;
}

export const RegressionPass: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([
    { name: 'List Simulations', endpoint: 'GET /simulations', status: 'pending' },
    { name: 'Receiver Status', endpoint: 'GET /receiver/status', status: 'pending' },
    { name: 'Scheduler Status', endpoint: 'GET /scheduler/status', status: 'pending' },
    { name: 'Scheduler Decision', endpoint: 'GET /scheduler/decision', status: 'pending' },
    { name: 'Scheduler History', endpoint: 'GET /scheduler/history', status: 'pending' },
    { name: 'List Models', endpoint: 'GET /models', status: 'pending' },
    { name: 'List Experiments', endpoint: 'GET /experiments', status: 'pending' },
    { name: 'Health check', endpoint: 'GET /health', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const runVerification = async () => {
    setIsRunning(true);
    const updated = [...results];

    const verify = async (idx: number, apiCall: () => Promise<any>) => {
      try {
        const res = await apiCall();
        const hasEnvelope = 'success' in res && 'requestId' in res;
        
        if (res.success && hasEnvelope) {
          updated[idx].status = 'success';
          updated[idx].details = `PASSED: Request ID: ${res.requestId}`;
        } else if (!res.success && hasEnvelope && res.error) {
          updated[idx].status = 'success';
          updated[idx].details = `PASSED (Compliant Error): Code: ${res.error.code}`;
        } else {
          updated[idx].status = 'failed';
          updated[idx].details = 'FAILED: Response missing standard success/requestId envelope';
        }
      } catch (err: any) {
        updated[idx].status = 'failed';
        updated[idx].details = `FAILED: ${err.message || err}`;
      }
    };

    // 0: List Simulations
    await verify(0, () => api.simulations.list());
    // 1: Receiver Status
    await verify(1, () => api.receiver.getStatus());
    // 2: Scheduler Status
    await verify(2, () => api.scheduler.getStatus());
    // 3: Scheduler Decision
    await verify(3, () => api.scheduler.getDecision());
    // 4: Scheduler History
    await verify(4, () => api.scheduler.getHistory());
    // 5: List Models
    await verify(5, () => api.models.list());
    // 6: List Experiments
    await verify(6, () => api.experiments.list());
    
    // 7: Health check
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
      const healthUrl = base.replace('/api/v1', '') + '/health';
      const res = await fetch(healthUrl);
      if (res.ok) {
        updated[7].status = 'success';
        updated[7].details = `PASSED: HTTP ${res.status}`;
      } else {
        updated[7].status = 'failed';
        updated[7].details = `FAILED: HTTP ${res.status}`;
      }
    } catch (e: any) {
      updated[7].status = 'failed';
      updated[7].details = `FAILED: ${e.message}`;
    }

    setResults(updated);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            Contract Regression Pass
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Automated validation suite verifying backend API contracts, envelope structures, and WebSocket conformance (Level 10).</p>
        </div>
      </div>

      {/* Automated Contract Verification Suite Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Automated Contract Verification Suite
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              This automated suite exercises target endpoints to ensure payload responses follow the envelope shape and key structures defined in <code className="text-indigo-300">API_CONTRACT.md</code>.
            </p>
          </div>
          <button 
            onClick={runVerification} 
            disabled={isRunning}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Verifying...' : 'Run Contract Check'}
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Test Case</th>
                <th className="py-3 px-4">Target Endpoint</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Details / Match Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {results.map((res, i) => (
                <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white">{res.name}</td>
                  <td className="py-3.5 px-4 font-mono text-indigo-300"><code>{res.endpoint}</code></td>
                  <td className="py-3.5 px-4">
                    {res.status === 'success' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        SUCCESS
                      </span>
                    )}
                    {res.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" />
                        FAILED
                      </span>
                    )}
                    {res.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`font-mono text-[11px] ${res.status === 'failed' ? 'text-rose-400 font-semibold' : 'text-slate-300'}`}>
                      {res.details || 'Ready to run...'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WebSocket Verification Guide Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-400" />
          WebSocket Verification Guide
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
          <li>
            Go to the <strong className="text-white">WebSocket Harness & Live Stream</strong> tab.
          </li>
          <li>
            Verify that your active simulation ID is selected and state displays <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-1">CONNECTED</span>.
          </li>
          <li>
            Verify that standard channel subscription messages are sent automatically upon connection.
          </li>
          <li>
            Verify the live scroll logs. Each incoming event must be encapsulated as a typed object containing:
            <ul className="list-disc list-inside pl-5 mt-1 space-y-1 text-slate-400">
              <li><code className="text-indigo-300">type</code>: one of <code className="text-indigo-300">spectrum_update</code>, <code className="text-indigo-300">scan_decision</code>, <code className="text-indigo-300">detection_event</code>, <code className="text-indigo-300">metrics_update</code>, <code className="text-indigo-300">training_progress</code></li>
              <li><code className="text-indigo-300">data</code>: payload matching the specific JSON format.</li>
            </ul>
          </li>
          <li>
            Test reconnect: Stop your backend service. Observe connection transitioning to <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-1">DISCONNECTED</span> and attempts to reconnect utilizing exponential backoff (1s &rarr; 2s &rarr; 4s &rarr; ... &rarr; 30s cap). Restart backend and verify auto-reconnection.
          </li>
        </ol>
      </div>
    </div>
  );
};