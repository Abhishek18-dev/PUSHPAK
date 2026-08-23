import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FlaskConical,
  Plus,
  Play,
  Square,
  BarChart3,
  AlertCircle,
  Layers,
  CheckSquare,
  Square as SquareOutline,
  FileCode,
  Activity,
  Shield,
  Sparkles,
  Award,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../services/api';
import type { PolicyType, ScenarioId } from '../types';

export const Experiments: React.FC = () => {
  const { experiments, activeResults, fetchExperiments, fetchExperimentResults, errorMsg } = useAppStore();

  const [scenario, setScenario] = useState<ScenarioId>('A');
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyType[]>(['baseline', 'bandit', 'q_learning']);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [runningExps, setRunningExps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handlePolicyToggle = (policy: PolicyType) => {
    setSelectedPolicies(prev =>
      prev.includes(policy) ? prev.filter(p => p !== policy) : [...prev, policy]
    );
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPolicies.length === 0) {
      toast.error('Select at least one policy for benchmark comparison.');
      return;
    }
    const res = await api.experiments.create({
      scenario,
      policies: selectedPolicies,
    });
    if (res.success) {
      toast.success('Experiment defined successfully!');
      fetchExperiments();
    } else {
      toast.error(`Failed: ${res.error?.message}`);
    }
  };

  const handleRunExperiment = async (id: string) => {
    setRunningExps(prev => ({ ...prev, [id]: true }));
    const res = await api.experiments.run(id);
    if (res.success) {
      toast.success('Benchmark evaluation completed!');
      fetchExperimentResults(id);
      setSelectedExpId(id);
    } else {
      toast.error(`Run failed: ${res.error?.message}`);
    }
    setRunningExps(prev => ({ ...prev, [id]: false }));
  };

  const handleStopExperiment = async (id: string) => {
    const res = await api.experiments.stop(id);
    if (res.success) {
      toast.warning('Experiment execution halted.');
    } else {
      toast.error(`Stop failed: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none font-sans pb-10">
      
      {/* ── 1. HEADER TITLE ── */}
      <div className="flex items-center justify-between pb-3 -green-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center -green-500/30">
            <FlaskConical className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-tactical font-extrabold tracking-wider text-white">
                EXPERIMENT BENCHMARK LAB
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-mono bg-green-500/15 text-green-300 -green-500/30 font-bold">
                LEVEL 8 EVALUATION
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notification */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 -rose-500/20 text-rose-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 2. MAIN 2-COLUMN GRID (CREATE & ALL EXPERIMENTS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: DEFINE EXPERIMENT (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 -white/5">
              <Plus className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                Define Benchmark Experiment
              </h3>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4">
              
              {/* Scenario Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-green-400" />
                  EVALUATION SCENARIO
                </label>
                <select
                  value={scenario}
                  onChange={e => setScenario(e.target.value as ScenarioId)}
                  className="w-full bg-[#050e08] border border-green-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-green-400 transition-colors cursor-pointer"
                >
                  <option value="A" className="bg-[#040c07] text-white">Scenario A - Mostly Fixed Emitters (Baseline test)</option>
                  <option value="B" className="bg-[#040c07] text-white">Scenario B - Periodic Radar Signals (Autocorrelation test)</option>
                  <option value="C" className="bg-[#040c07] text-white">Scenario C - Frequency Agile Radars (Hop tracking)</option>
                  <option value="D" className="bg-[#040c07] text-white">Scenario D - Mixed Multi-Emitter Environment</option>
                  <option value="E" className="bg-[#040c07] text-white">Scenario E - High Density Spectrum Congestion</option>
                  <option value="F" className="bg-[#040c07] text-white">Scenario F - Sparse Stealth Emitters</option>
                  <option value="G" className="bg-[#040c07] text-white">Scenario G - Rapidly Changing Tactical Combat</option>
                </select>
              </div>

              {/* Policy Checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-green-400" />
                  SELECT POLICIES TO BENCHMARK
                </label>
                <div className="grid grid-cols-1 gap-2 pt-0.5">
                  {(['baseline', 'bandit', 'q_learning', 'dqn', 'ppo'] as PolicyType[]).map(pol => {
                    const isChecked = selectedPolicies.includes(pol);
                    return (
                      <button
                        key={pol}
                        type="button"
                        onClick={() => handlePolicyToggle(pol)}
                        className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl text-xs font-mono transition-all text-left cursor-pointer ${
                          isChecked
                            ? 'bg-green-500/20 -green-500/40 text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                            : 'bg-white/[0.02] -white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-green-400 shrink-0" />
                          ) : (
                            <SquareOutline className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className="font-bold uppercase">{pol.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {pol === 'baseline' ? 'Round Robin' : pol === 'bandit' ? 'Exp3 (MVP)' : pol === 'q_learning' ? 'Tabular RL' : pol === 'dqn' ? 'Deep Q-Net' : 'PPO Actor'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                CREATE EXPERIMENT DEFINITION
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: ALL EXPERIMENTS TABLE (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 -white/5">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-green-400" />
                <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                  Configured Experiments Registry
                </h3>
              </div>
              <span className="text-[9px] font-mono text-slate-400">
                {experiments.length} TOTAL
              </span>
            </div>

            {(!experiments || experiments.length === 0) ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400 -dashed -white/10 rounded-2xl">
                No experiments defined yet. Use the panel on the left to create your first multi-policy benchmark.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl -white/10">
                <table className="w-full text-left -collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-white/[0.04] text-[10px] text-slate-400 uppercase tracking-wider -white/10">
                      <th className="py-3 px-3.5">ID</th>
                      <th className="py-3 px-3.5">Scenario</th>
                      <th className="py-3 px-3.5">Policies</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {experiments.map(exp => {
                      const expId = exp.id || '';
                      const isSelected = selectedExpId === expId;
                      const isRunning = runningExps[expId];
                      const policiesLabel = Array.isArray(exp.policies)
                        ? exp.policies.map(p => String(p).replace('_', ' ')).join(', ')
                        : (exp.policies ? String(exp.policies) : 'None');

                      return (
                        <tr
                          key={expId}
                          className={`transition-colors ${isSelected ? 'bg-green-500/15' : 'hover:bg-white/[0.03]'}`}
                        >
                          <td className="py-3 px-3.5 text-green-400 font-bold">
                            EXP-{expId.slice(-4) || '----'}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/15 text-green-300 -green-500/30">
                              Scenario {exp.scenario || 'A'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-300 text-[10px] truncate max-w-[150px]">
                            {policiesLabel}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 -green-500/40 text-green-300 hover:bg-green-500/30 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                                onClick={() => handleRunExperiment(expId)}
                                disabled={isRunning}
                              >
                                <Play className="w-3 h-3" />
                                {isRunning ? 'Running...' : 'Run'}
                              </button>
                              <button
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 -rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                onClick={() => handleStopExperiment(expId)}
                              >
                                <Square className="w-3 h-3" />
                                Stop
                              </button>
                              <button
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                                onClick={() => {
                                  setSelectedExpId(expId);
                                  fetchExperimentResults(expId);
                                }}
                              >
                                <BarChart3 className="w-3 h-3" />
                                Inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── 3. DETAILED RESULTS COMPARISON MATRIX ── */}
      {selectedExpId && (
        <div className="p-6 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/25 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 -white/10">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-tactical font-bold text-white uppercase tracking-wider">
                Benchmark Comparison Results (EXP-{selectedExpId.slice(-6)})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full -green-500/30 font-bold">
              EVALUATION COMPLETED
            </span>
          </div>

          {activeResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Comparative Metrics Table */}
              <div>
                <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-300 uppercase mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-green-400" />
                  POLICY PERFORMANCE METRICS (Pd, Pfa, LATENCY)
                </h4>
                <div className="overflow-x-auto rounded-2xl -white/10">
                  <table className="w-full text-left -collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-white/[0.04] text-[10px] text-slate-400 uppercase tracking-wider -white/10">
                        <th className="py-3 px-4">Policy Strategy</th>
                        <th className="py-3 px-4">P(Detection)</th>
                        <th className="py-3 px-4">P(False Alarm)</th>
                        <th className="py-3 px-4">AIT / Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(activeResults.results || {}).map(([pol, res]: [string, any]) => (
                        <tr key={pol} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4 font-bold text-white uppercase">{String(pol).replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-green-400 font-bold">{(Number(res?.pd ?? 0) * 100).toFixed(1)}%</td>
                          <td className="py-3 px-4 text-rose-400 font-bold">{(Number(res?.pfa ?? 0) * 100).toFixed(2)}%</td>
                          <td className="py-3 px-4 text-amber-300 font-bold">{Number(res?.latency ?? 0).toFixed(1)} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw JSON Trace */}
              <div>
                <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-300 uppercase mb-3 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-green-400" />
                  RAW EVALUATION TELEMETRY LOG
                </h4>
                <pre className="p-4 rounded-2xl bg-transparent -white/10 text-[11px] font-mono text-green-300 overflow-x-auto max-h-64 custom-scrollbar">
                  {JSON.stringify(activeResults, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-slate-400">
              Select an experiment and click "Inspect" or "Run" to view comparative results.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Experiments;