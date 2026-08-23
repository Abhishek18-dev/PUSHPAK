import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Cpu, Sliders, Layers, Sparkles } from 'lucide-react';
import { PolicyType, ScenarioId } from '../types/rf';

export const ScannerControls: React.FC = () => {
  const { simulation, setPolicy, setBandwidthK, loadScenario } = useSimulationStore();

  return (
    <div className="bento-card p-5 space-y-5">
      <div className="flex items-center space-x-2 -green-500/15 pb-3">
        <Sliders className="w-5 h-5 text-green-400" />
        <h2 className="font-tactical font-bold text-sm text-white tracking-wider">
          RECEIVER & SCHEDULER CONFIGURATION
        </h2>
      </div>

      {/* Policy Selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5 font-semibold">
          <Cpu className="w-4 h-4 text-green-400" />
          SCHEDULER POLICY
        </label>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'baseline', name: 'Open-Loop Baseline', desc: 'Round-Robin fixed scan' },
            { id: 'bandit', name: 'Contextual Bandit (MVP)', desc: 'Adaptive reward policy' },
            { id: 'q_learning', name: 'Tabular Q-Learning (V1)', desc: 'State-action Q-table' },
            { id: 'dqn', name: 'Deep Q-Network (V2)', desc: 'Neural function approx' },
          ].map((p) => {
            const isSelected = simulation.policy === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPolicy(p.id as PolicyType)}
                className={`p-3 rounded-2xl text-left transition-all duration-300 ${
                  isSelected
                    ? 'bg-green-500/10 -green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                    : 'bg-white/[0.02] -white/5 hover:-green-500/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold font-mono ${isSelected ? 'text-green-300' : 'text-slate-200'}`}>
                    {p.name}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-green-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bandwidth K Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold">INSTANTANEOUS BANDWIDTH (K)</span>
          <span className="text-green-400 font-bold">{simulation.receiver.bandwidth_k} Bands / step</span>
        </div>
        <input
          type="range"
          min="1"
          max="8"
          value={simulation.receiver.bandwidth_k}
          onChange={(e) => setBandwidthK(Number(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-green-400"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>K=1 (Narrow)</span>
          <span>K=4</span>
          <span>K=8 (Wide)</span>
        </div>
      </div>

      {/* Preset Scenarios Loader */}
      <div className="space-y-2 -green-500/15 pt-4">
        <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5 font-semibold">
          <Layers className="w-4 h-4 text-emerald-400" />
          EXPERIMENT SCENARIO SUITE (A–G)
        </label>
        <div className="grid grid-cols-4 gap-2 font-mono text-xs">
          {(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as ScenarioId[]).map((sc) => (
            <button
              key={sc}
              onClick={() => loadScenario(sc)}
              className={`p-2 text-center rounded-xl transition-all duration-300 ${
                simulation.id.includes(sc)
                  ? 'bg-emerald-500/15 -emerald-500/40 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                  : 'bg-white/[0.02] -white/5 text-slate-400 hover:text-emerald-200 hover:-emerald-500/20'
              }`}
            >
              SCENARIO {sc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
