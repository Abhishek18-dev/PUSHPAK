import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Radio, Play, Pause, RotateCcw, ShieldAlert, Cpu, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { simulation, startSimulation, stopSimulation, resetSimulation, stepSimulation } = useSimulationStore();
  const isRunning = simulation.status === 'running';

  return (
    <header className="sticky top-0 z-50 px-6 py-3 mb-6 bg-transparent backdrop-blur-xl -white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title and Branding */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 -green-500/30 rounded-xl text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-tactical font-bold text-lg text-white tracking-widest uppercase">
                INTELLIGENT RF SPECTRUM SCAN STRATEGY
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-400 -green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)] uppercase">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span>AI/ML Scan Scheduler</span>
              <span className="text-white/20">•</span>
              <span className="text-green-400">Seed: {simulation.seed}</span>
              <span className="text-white/20">•</span>
              <span className="text-white font-bold">Step: <span className="text-green-400">{simulation.current_step}</span>/{simulation.duration_steps}</span>
            </p>
          </div>
        </div>

        {/* Scope Banner */}
        <div className="hidden lg:flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 -amber-500/30 rounded-full text-amber-300 text-[10px] font-mono tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.05)]">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>SOFTWARE SIMULATION ONLY — NO REAL RF HARDWARE</span>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center space-x-3">
          {isRunning ? (
            <button
              onClick={stopSimulation}
              className="flex items-center space-x-2 px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 -amber-500/50 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            >
              <Pause className="w-4 h-4" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center space-x-2 px-5 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 -green-500/50 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            >
              <Play className="w-4 h-4" />
              <span>RUN LIVE</span>
            </button>
          )}

          <button
            onClick={stepSimulation}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold tracking-wider -white/10 transition-all duration-300 hover:-white/20"
            title="Single Step"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>STEP</span>
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold tracking-wider -white/10 transition-all duration-300 hover:-white/20"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>RESET</span>
          </button>
        </div>
      </div>
    </header>
  );
};
