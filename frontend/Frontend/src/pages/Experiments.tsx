import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Activity
} from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../services/api';
import type { PolicyType, ScenarioId } from '../types';

export const Experiments: React.FC = () => {
  const { experiments, activeResults, fetchExperiments, fetchExperimentResults, errorMsg } = useAppStore();

  const [scenario, setScenario] = useState<ScenarioId>('A');
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyType[]>(['baseline', 'bandit']);
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
      toast.error('Select at least one policy.');
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
      toast.success('Experiment started executing.');
      fetchExperimentResults(id);
    } else {
      toast.error(`Run failed: ${res.error?.message}`);
    }
    setRunningExps(prev => ({ ...prev, [id]: false }));
  };

  const handleStopExperiment = async (id: string) => {
    const res = await api.experiments.stop(id);
    if (res.success) {
      toast.success('Experiment stopped.');
    } else {
      toast.error(`Stop failed: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-indigo-400" />
            Experiment Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Design comparative evaluation experiments and analyze multi-policy execution results (Level 8).</p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Create Experiment Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Define New Experiment
            </h3>

            <form onSubmit={handleCreateExperiment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  Scenario
                </label>
                <select
                  value={scenario}
                  onChange={e => setScenario(e.target.value as ScenarioId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="A">Scenario A - Mostly Fixed</option>
                  <option value="B">Scenario B - Mostly Periodic</option>
                  <option value="C">Scenario C - Frequency Agile</option>
                  <option value="D">Scenario D - Mixed Environment</option>
                  <option value="E">Scenario E - High Density</option>
                  <option value="F">Scenario F - Sparse</option>
                  <option value="G">Scenario G - Rapidly Changing</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Policies to Compare
                </label>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {(['baseline', 'bandit', 'q_learning', 'dqn', 'ppo'] as PolicyType[]).map(pol => {
                    const isChecked = selectedPolicies.includes(pol);
                    return (
                      <button
                        key={pol}
                        type="button"
                        onClick={() => handlePolicyToggle(pol)}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors border text-left cursor-pointer ${isChecked
                            ? 'bg-indigo-600/10 border-indigo-500/30 text-white'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                        ) : (
                          <SquareOutline className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className="capitalize">{pol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer pt-2 mt-2"
              >
                <Plus className="w-4 h-4" />
                POST /experiments
              </button>
            </form>
          </div>
        </div>

        {/* List & Run Experiments Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-indigo-400" />
              All Experiments
            </h3>

            {experiments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No experiments found.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">ID</th>
                      <th className="py-3 px-3">Scenario</th>
                      <th className="py-3 px-3">Policies</th>
                      <th className="py-3 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {experiments.map(exp => {
                      const isSelected = selectedExpId === exp.id;
                      return (
                        <tr
                          key={exp.id}
                          className={`transition-colors ${isSelected ? 'bg-indigo-950/20' : 'hover:bg-slate-800/20'}`}
                        >
                          <td className="py-3 px-3 font-mono text-slate-400"><code>{exp.id.slice(-6)}</code></td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {exp.scenario}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px] truncate max-w-[140px]">{exp.policies.join(', ')}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                                onClick={() => handleRunExperiment(exp.id)}
                                disabled={runningExps[exp.id]}
                              >
                                <Play className="w-3 h-3" />
                                {runningExps[exp.id] ? 'Running...' : 'Run'}
                              </button>
                              <button
                                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 transition-colors flex items-center gap-1 cursor-pointer"
                                onClick={() => handleStopExperiment(exp.id)}
                              >
                                <Square className="w-3 h-3" />
                                Stop
                              </button>
                              <button
                                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                onClick={() => {
                                  setSelectedExpId(exp.id);
                                  fetchExperimentResults(exp.id);
                                }}
                              >
                                <BarChart3 className="w-3 h-3" />
                                Results
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

      {/* Results View */}
      {selectedExpId && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Experiment Results (ID: <code className="text-indigo-400 font-mono">{selectedExpId}</code>)
            </h3>
          </div>

          {activeResults ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">Comparison Summary</h4>
                <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Policy</th>
                        <th className="py-3 px-4">Pd</th>
                        <th className="py-3 px-4">Pfa</th>
                        <th className="py-3 px-4">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {Object.entries(activeResults.results || {}).map(([pol, res]: [string, any]) => (
                        <tr key={pol} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-4 font-semibold text-white capitalize">{pol}</td>
                          <td className="py-3 px-4 text-emerald-400 font-mono">{(res.pd * 100).toFixed(1)}%</td>
                          <td className="py-3 px-4 text-amber-400 font-mono">{(res.pfa * 100).toFixed(2)}%</td>
                          <td className="py-3 px-4 text-slate-300 font-mono">{res.latency.toFixed(1)} steps</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  Raw JSON response
                </h4>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-64">
                  {JSON.stringify(activeResults, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4">Loading experiment results...</p>
          )}
        </motion.div>
      )}
    </div>
  );
};