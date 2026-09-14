import React, { useState, useEffect } from 'react';
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
  RefreshCcw,
  Zap,
  TrendingUp,
  Award
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
      toast.success('RL Training job dispatched!', { description: `Job ID: ${res.data.job_id}` });
      fetchModels();
      setActiveTab('models');
    } else {
      toast.error(`Failed to start training: ${res.error?.message}`);
    }
  };

  const handleActivateModel = async (id: string) => {
    const res = await api.models.activate(id);
    if (res.success) {
      toast.success('Model promoted to ACTIVE policy!');
      fetchModels();
    } else {
      toast.error(`Activation failed: ${res.error?.message}`);
    }
  };

  const handleEvaluate = async (id: string) => {
    const res = await api.models.evaluate(id, {
      scenario: evalScenario,
      episode_count: evalEpisodes,
    });
    if (res.success && res.data) {
      setEvalResults(res.data);
      toast.success('Model evaluation complete!');
    } else {
      toast.error(`Evaluation failed: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none font-sans pb-10">
      
      {/* ── HEADER TITLE ── */}
      <div className="flex items-center justify-between pb-3 -green-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center -green-500/30">
            <Cpu className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-tactical font-extrabold tracking-wider text-white">
                MODELS & RL TRAINING PIPELINE
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono bg-green-500/15 text-green-300 -green-500/30 font-bold">
                RL DISPATCH
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/[0.04] p-1 rounded-full text-xs font-mono">
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'models'
                ? 'bg-green-500/20 text-green-300 font-bold shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Registry ({models.length})
          </button>
          <button
            onClick={() => setActiveTab('train')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'train'
                ? 'bg-green-500/20 text-green-300 font-bold shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Train New Policy
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 -rose-500/20 text-rose-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── TRAIN NEW MODEL TAB ── */}
      {activeTab === 'train' ? (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 pb-2 -white/5">
            <Sparkles className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-tactical font-bold text-white uppercase tracking-wider">
              Launch Reinforcement Learning Training Job
            </h3>
          </div>

          <form onSubmit={handleTrainSubmit} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-300">ALGORITHM ARCHITECTURE</label>
                <select
                  value={algorithm}
                  onChange={e => setAlgorithm(e.target.value)}
                  className="w-full bg-[#050e08] border border-green-500/30 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-green-400 cursor-pointer"
                >
                  <option value="bandit" className="bg-[#040c07] text-white">Multi-Armed Bandit (Exp3 - MVP)</option>
                  <option value="q_learning" className="bg-[#040c07] text-white">Tabular Q-Learning (V1)</option>
                  <option value="dqn" className="bg-[#040c07] text-white">Deep Q-Network (V2)</option>
                  <option value="ppo" className="bg-[#040c07] text-white">PPO Actor-Critic (V3)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-300">TRAINING SCENARIO</label>
                <select
                  value={scenario}
                  onChange={e => setScenario(e.target.value)}
                  className="w-full bg-[#050e08] border border-green-500/30 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-green-400 cursor-pointer"
                >
                  <option value="A" className="bg-[#040c07] text-white">Scenario A - Mostly Fixed</option>
                  <option value="B" className="bg-[#040c07] text-white">Scenario B - Mostly Periodic</option>
                  <option value="C" className="bg-[#040c07] text-white">Scenario C - Frequency Agile</option>
                  <option value="D" className="bg-[#040c07] text-white">Scenario D - Mixed Multi-Emitter</option>
                  <option value="E" className="bg-[#040c07] text-white">Scenario E - High Density</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-300">EPISODE COUNT</label>
                <input
                  type="number"
                  value={episodeCount}
                  onChange={e => setEpisodeCount(Number(e.target.value))}
                  min={10}
                  className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:-green-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-300">SEED START</label>
                <input
                  type="number"
                  value={seedStart}
                  onChange={e => setSeedStart(Number(e.target.value))}
                  className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:-green-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-300">SEED END</label>
                <input
                  type="number"
                  value={seedEnd}
                  onChange={e => setSeedEnd(Number(e.target.value))}
                  className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:-green-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <Play className="w-4 h-4" />
              DISPATCH RL TRAINING WORKER
            </button>
          </form>
        </div>
      ) : (
        /* ── REGISTERED MODELS LIST TAB ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(!models || models.length === 0) ? (
            <div className="col-span-full p-8 text-center text-xs font-mono text-slate-400 -dashed -white/10 rounded-2xl">
              No trained models registered yet. Click "Train New Policy" to train your first RL model.
            </div>
          ) : (
            models.map((m, idx) => {
              const modelId = m.id || m.model_id || `model_${idx}`;
              const displayId = modelId.length > 6 ? modelId.slice(-6) : modelId;

              return (
                <div
                  key={modelId}
                  className="p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 hover:-green-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-tactical font-bold text-sm text-white tracking-wider">
                        MODEL-{displayId}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        m.active
                          ? 'bg-green-500/20 text-green-300 -green-500/40' 
                          : 'bg-white/5 text-slate-400'
                      }`}>
                        {m.active ? 'ACTIVE' : 'CHECKPOINT'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono py-1">
                      <div className="p-2 bg-white/[0.02] rounded-xl">
                        <span className="text-[8px] text-slate-400 block">ALGORITHM</span>
                        <strong className="text-white uppercase">{String(m.algorithm || 'unknown')}</strong>
                      </div>
                      <div className="p-2 bg-white/[0.02] rounded-xl">
                        <span className="text-[8px] text-slate-400 block">VERSION</span>
                        <strong className="text-green-300">v{m.version || '1.0'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 -white/5">
                    <button
                      onClick={() => handleActivateModel(modelId)}
                      disabled={m.active}
                      className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/20 -green-500/40 text-green-300 hover:bg-green-500/30 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      {m.active ? 'ACTIVE POLICY' : 'ACTIVATE'}
                    </button>

                    <button
                      onClick={() => handleEvaluate(modelId)}
                      className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <BarChart3 className="w-3 h-3" /> Evaluate
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Evaluation Results Drawer */}
      {evalResults && (
        <div className="p-6 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/25 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 -white/10">
            <h3 className="text-sm font-tactical font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Model Evaluation Report
            </h3>
            <button onClick={() => setEvalResults(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <pre className="p-4 rounded-2xl bg-transparent -white/10 text-[11px] font-mono text-green-300 overflow-x-auto max-h-64 custom-scrollbar">
            {JSON.stringify(evalResults, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
};

export default ModelsTraining;