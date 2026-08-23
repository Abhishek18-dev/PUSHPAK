import React, { useState } from 'react';
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

    await verify(0, () => api.simulations.list());
    await verify(1, () => api.receiver.getStatus());
    await verify(2, () => api.scheduler.getStatus());
    await verify(3, () => api.scheduler.getDecision());
    await verify(4, () => api.scheduler.getHistory());
    await verify(5, () => api.models.list());
    await verify(6, () => api.experiments.list());
    await verify(7, () => api.health());

    setResults(updated);
    setIsRunning(false);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none font-sans pb-10">
      
      {/* ── HEADER TITLE ── */}
      <div className="flex items-center justify-between pb-3 -green-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center -green-500/30">
            <ShieldCheck className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-tactical font-extrabold tracking-wider text-white">
                CONTRACT REGRESSION PASS SUITE
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono bg-green-500/15 text-green-300 -green-500/30 font-bold">
                API COMPLIANCE
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={runVerification}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'EXECUTING TEST SUITE...' : 'RUN FULL REGRESSION SUITE'}
        </button>
      </div>

      {/* ── SUMMARY SCORECARD ── */}
      <div className="grid grid-cols-3 gap-4 font-mono">
        <div className="p-4 rounded-3xl bg-white/[0.02] -green-500/20 backdrop-blur-md">
          <span className="text-[9px] text-slate-400 block uppercase">TOTAL ENDPOINTS</span>
          <strong className="text-white text-base">{results.length} Tests</strong>
        </div>
        <div className="p-4 rounded-3xl bg-green-500/10 -green-500/30 backdrop-blur-md">
          <span className="text-[9px] text-green-400 block uppercase">PASSED (COMPLIANT)</span>
          <strong className="text-green-300 text-base">{successCount} Endpoints</strong>
        </div>
        <div className="p-4 rounded-3xl bg-rose-500/10 -rose-500/30 backdrop-blur-md">
          <span className="text-[9px] text-rose-400 block uppercase">FAILED CONTRACTS</span>
          <strong className="text-rose-300 text-base">{failedCount} Failures</strong>
        </div>
      </div>

      {/* ── TESTS RESULT MATRIX ── */}
      <div className="p-6 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 -white/5">
          <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
            Endpoint Verification Table
          </h3>
          <span className="text-[9px] font-mono text-slate-400">
            Envelopes: success, requestId, data, error
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl -white/10">
          <table className="w-full text-left -collapse font-mono text-xs">
            <thead>
              <tr className="bg-white/[0.04] text-[10px] text-slate-400 uppercase tracking-wider -white/10">
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {results.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{r.name}</td>
                  <td className="py-3 px-4 text-green-400">{r.endpoint}</td>
                  <td className="py-3 px-4">
                    {r.status === 'success' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/20 text-green-300 -green-500/40 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    )}
                    {r.status === 'failed' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 -rose-500/40 inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> FAIL
                      </span>
                    )}
                    {r.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-slate-400 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> READY
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[10px] truncate max-w-md">
                    {r.details || 'Awaiting test trigger'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default RegressionPass;