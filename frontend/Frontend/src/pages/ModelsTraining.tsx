import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Hash, 
  Key, 
  Activity, 
  BarChart3, 
  AlertCircle, 
  Sparkles,
  RefreshCcw
} from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../services/api';

export const ModelsTraining: React.FC = () => {
  const { models, trainingProgress, fetchModels, errorMsg } = useAppStore();

  const [algorithm, setAlgorithm] = useState('bandit');
  const [scenario, setScenario] = useState('A');
  const [episodeCount, setEpisodeCount] = useState(100);
  const [seedStart, setSeedStart] = useState(1);
  const [seedEnd, setSeedEnd] = useState(10);
  const [activeTab, setActiveTab] = useState<'models' | 'train'>('models');

  // Eval states
  const [evalScenario, setEvalScenario] = useState('A');
  const [evalEpisodes, setEvalEpisodes] = useState(50);
  const [evalResults, setEvalResults] = useState<any>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const handleTrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.models.train({
      algorithm,
      scenario,
      episode_count: episodeCount,
      seed_range: [seedStart, seedEnd],
      hyperparams: {},
    });
    if (res.success && res.data) {
      toast.success('Training job started!', { description: `Job ID: ${res.data.job_id}` });
      fetchModels();
    } else {
      toast.error(`Failed to start training: ${res.error?.message}`);
    }
  };

  const handleActivateModel = async (id: string) => {
    const res = await api.models.activate(id);
    if (res.success) {
      toast.success('Model promoted to ACTIVE!');
      fetchModels();
    } else {
      toast.error(`Failed: ${res.error?.message}`);
    }
  };

  const handleEvaluateModel = async (id: string) => {
    const res = await api.models.evaluate(id, {
      scenario: evalScenario,
      episode_count: evalEpisodes,
    });
    if (res.success) {
      setEvalResults(res.data);
      toast.success('Evaluation completed successfully.');
    } else {
      toast.error(`Evaluation failed: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            Model Registry & Training Control
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage reinforcement learning model registry, execute training pipelines, and evaluate policies (Level 7).</p>
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

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 w-fit">
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'models' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Model Registry
        </button>
        <button
          onClick={() => setActiveTab('train')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'train' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Launch Training Job
        </button>
      </div>

      {activeTab === 'train' ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-400" />
              POST /api/v1/models/train
            </h3>
            <form onSubmit={handleTrainSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    Algorithm
                  </label>
                  <select 
                    value={algorithm} 
                    onChange={e => setAlgorithm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="bandit">Multi-Armed Bandit</option>
                    <option value="q_learning">Tabular Q-Learning</option>
                    <option value="dqn">Deep Q-Network (DQN)</option>
                    <option value="ppo">PPO</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Training Scenario Mix
                  </label>
                  <select 
                    value={scenario} 
                    onChange={e => setScenario(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="A">Scenario A - Mostly Fixed</option>
                    <option value="B">Scenario B - Mostly Periodic</option>
                    <option value="C">Scenario C - Frequency Agile</option>
                    <option value="D">Scenario D - Mixed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    Episode Count
                  </label>
                  <input 
                    type="number" 
                    value={episodeCount} 
                    onChange={e => setEpisodeCount(Number(e.target.value))} 
                    min={10} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Seed Range Start
                  </label>
                  <input 
                    type="number" 
                    value={seedStart} 
                    onChange={e => setSeedStart(Number(e.target.value))} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Seed Range End
                  </label>
                  <input 
                    type="number" 
                    value={seedEnd} 
                    onChange={e => setSeedEnd(Number(e.target.value))} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Submit Training Job
              </button>
            </form>

            {trainingProgress && (
              <div className="mt-6 p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Live Training Progress (WS Feed)</h4>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Job ID: <code className="text-indigo-400 font-mono">{trainingProgress.job_id}</code></span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {trainingProgress.status}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-200" 
                    style={{ width: `${trainingProgress.progress * 100}%` }}
                  />
                </div>
                <p className="text-right text-xs font-mono text-slate-400">{Math.round(trainingProgress.progress * 100)}%</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Models list */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Registered Models
              </h3>
              {models.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No models found in registry.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Algorithm</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {models.map(model => (
                        <tr key={model.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-400"><code>{model.id.slice(-8)}</code></td>
                          <td className="py-3.5 px-4 font-medium text-white">{model.algorithm}</td>
                          <td className="py-3.5 px-4">
                            {model.active ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              disabled={model.active}
                              onClick={() => handleActivateModel(model.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Activate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Model Evaluation Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Evaluate Active Model
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Eval Scenario
                  </label>
                  <select 
                    value={evalScenario} 
                    onChange={e => setEvalScenario(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="A">Scenario A</option>
                    <option value="B">Scenario B</option>
                    <option value="C">Scenario C</option>
                    <option value="D">Scenario D</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    Eval Episodes
                  </label>
                  <input 
                    type="number" 
                    value={evalEpisodes} 
                    onChange={e => setEvalEpisodes(Number(e.target.value))} 
                    min={5} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  const activeMod = models.find(m => m.active);
                  if (activeMod) handleEvaluateModel(activeMod.id);
                }}
                disabled={!models.some(m => m.active)}
                className="w-full mb-6 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCcw className="w-4 h-4" />
                Run Evaluation
              </button>

              <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Evaluation Results (Pd / Pfa / Latency)</h4>
              {evalResults ? (
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-48">
                  {JSON.stringify(evalResults, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No evaluation results. Select active model and hit evaluate.
                </p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};