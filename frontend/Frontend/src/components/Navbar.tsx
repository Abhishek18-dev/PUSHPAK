import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Radio, Play, Pause, RotateCcw, ShieldAlert, Cpu, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { simulation, startSimulation, stopSimulation, resetSimulation, stepSimulation } = useSimulationStore();
  const isRunning = simulation.status === 'running';

  return (
    <header className="border-b border-slate-800 bg-[#0d121d] px-6 py-3 sticky top-0 z-50 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title and Branding */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-wide font-mono">
                INTELLIGENT RF SPECTRUM SCAN STRATEGY
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>AI/ML Scan Scheduler</span>
              <span>•</span>
              <span className="text-emerald-400">Seed: {simulation.seed}</span>
              <span>•</span>
              <span className="text-cyan-400 font-mono">Step: {simulation.current_step}/{simulation.duration_steps}</span>
            </p>
          </div>
        </div>

        {/* Scope Banner */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-mono">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>SOFTWARE SIMULATION ONLY — NO REAL RF HARDWARE / INTERCEPTION</span>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <button
              onClick={stopSimulation}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-amber-500/20"
            >
              <Pause className="w-4 h-4" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-cyan-500/30"
            >
              <Play className="w-4 h-4" />
              <span>RUN LIVE</span>
            </button>
          )}

          <button
            onClick={stepSimulation}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
            title="Single Step"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>STEP</span>
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>RESET</span>
          </button>
        </div>
      </div>
    </header>
  );
};
