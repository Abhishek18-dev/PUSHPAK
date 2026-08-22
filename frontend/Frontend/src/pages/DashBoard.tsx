import React, { useState, useEffect } from 'react';
import {
  Activity, Radio, ShieldAlert, Play, Pause, LogOut,
  RadioTower, Layers, CheckCircle2, Crosshair, ArrowRight,
  Cpu, BarChart2, Wifi, WifiOff, ShieldCheck, Terminal,
  ChevronLeft, RotateCcw, Sparkles, Shuffle
} from 'lucide-react';
import { toast } from 'sonner';

import Radar from '../components/Radar';
import { Simulations } from './Simulations';
import { EmittersReceiver } from './EmittersReceiver';
import { Scheduler } from './Scheduler';
import { WSHarness } from './WSHarness';
import { ModelsTraining } from './ModelsTraining';
import { Experiments } from './Experiments';
import { Metrics } from './Metrics';
import { RegressionPass } from './RegressionPass';
import { useAppStore } from '../store';
import { api } from '../services/api';

interface DashboardProps {
  onLogout?: () => void;
}

type TabId = 'command' | 'simulations' | 'emitters' | 'scheduler' | 'experiments' | 'models' | 'metrics' | 'websocket' | 'regression';

export function Dashboard({ onLogout }: DashboardProps) {
  const { 
    activeSimulation, activeSimulationId, liveMetrics, detections, decisionHistory, 
    updateSimulationStatus, simulations, emitters, experiments,
    bandOccupancy, models, trainingProgress, wsState, wsLogs,
    tunedBands, latestDecision,
    fetchSimulations, fetchModels, fetchExperiments, setActiveSimulation,
    createSimulation, activePolicy, setActivePolicy
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<TabId>('command');
  const [isRunning, setIsRunning] = useState(false);
  const currentStep = liveMetrics?.step ?? activeSimulation?.current_step ?? 0;

  // Fetch backend data on mount
  useEffect(() => {
    fetchSimulations();
    fetchModels();
    fetchExperiments();
  }, []);

  // Auto-activate the first running simulation (or any sim) once simulations load
  useEffect(() => {
    if (simulations.length > 0 && !activeSimulationId) {
      const running = simulations.find(s => s.status === 'running');
      const target = running || simulations[0];
      if (target) {
        setActiveSimulation(target.id);
        if (target.status === 'running') setIsRunning(true);
      }
    }
  }, [simulations, activeSimulationId]);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(true);
    toast.success(`Simulation started with ${activePolicy.toUpperCase()} policy`);
    if (activeSimulation?.id) {
      await api.simulations.start(activeSimulation.id, activePolicy);
      updateSimulationStatus(activeSimulation.id, 'running');
    }
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(false);
    toast.warning('Simulation paused');
    if (activeSimulation?.id) {
      await api.simulations.stop(activeSimulation.id);
      updateSimulationStatus(activeSimulation.id, 'paused');
    }
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(false);
    toast.info('Simulation reset to start');
    if (activeSimulation?.id) {
      await api.simulations.reset(activeSimulation.id);
      updateSimulationStatus(activeSimulation.id, 'draft');
    }
  };

  const handleRandomScenario = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const randomSeed = Math.floor(Math.random() * 90000) + 1000;
    const bandOptions = [16, 24, 32];
    const randomBands = bandOptions[Math.floor(Math.random() * bandOptions.length)];
    const simName = `Sector-${String.fromCharCode(65 + Math.floor(Math.random() * 6))}-${randomSeed}`;

    toast.info(`Creating ${simName} (Seed: ${randomSeed}, Bands: ${randomBands})...`);
    const createdResult = await createSimulation(simName, randomBands, 2000, randomSeed);
    
    if (createdResult) {
      const newId = typeof createdResult === 'string' ? createdResult : null;
      await fetchSimulations();
      const allSims = useAppStore.getState().simulations;
      const targetSim = (newId ? allSims.find(s => s.id === newId) : null) || allSims.find(s => s.name === simName) || allSims[0];
      if (targetSim) {
        await setActiveSimulation(targetSim.id);
        await api.simulations.start(targetSim.id, activePolicy);
        updateSimulationStatus(targetSim.id, 'running');
        setIsRunning(true);
        toast.success(`Active on ${targetSim.name} running ${activePolicy.toUpperCase()}!`);
      }
    }
  };

  const navigateTo = (tab: TabId) => {
    setActiveTab(tab);
  };

  const goHome = () => setActiveTab('command');

  const hc = "hover:-translate-y-1 hover:border-[#00E5FF]/40 hover:shadow-[0_15px_40px_-10px_rgba(0,229,255,0.15)] transition-all duration-300 cursor-pointer";

  // Computed backend-driven stats
  const runningSims = simulations.filter(s => s.status === 'running').length;
  const completedSims = simulations.filter(s => s.status === 'completed').length;
  const activeModelsCount = models.filter(m => m.active).length;
  const runningExperiments = experiments.filter(e => e.status === 'running').length;
  const activeBands = Object.keys(bandOccupancy).length;

  // Are we on the main command dashboard?
  const isHome = activeTab === 'command';

  return (
    <div className="h-screen w-screen bg-[#060a10] text-slate-200 font-sans selection:bg-[#00E5FF] selection:text-black flex flex-col overflow-hidden">
      
      {/* Top Header */}
      <header className="flex-none relative z-20 flex items-center justify-between px-6 py-3 border-b border-[#ffffff08] bg-[#060a10]/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          {!isHome && (
            <button onClick={goHome} className="p-2 rounded-lg border border-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:scale-105 transition-all mr-2" title="Back to Dashboard">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div onClick={goHome} className="p-2.5 bg-[#00E5FF] rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:shadow-[0_0_25px_rgba(0,229,255,0.6)] hover:scale-105 transition-all cursor-pointer">
            <RadioTower className="w-5 h-5 text-black" />
          </div>
          <span className="font-semibold text-slate-200 tracking-widest text-sm">PUSHPAK<span className="text-[#00E5FF]">_SOC</span></span>
        </div>
        <div className="flex items-center gap-4">
          {/* Live Status Indicators from backend */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full border ${wsState === 'CONNECTED' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
              {wsState === 'CONNECTED' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              WS: {wsState}
            </span>
            <span className="px-2 py-1 rounded-full border border-[#00E5FF]/20 text-slate-400">
              Step: {currentStep}
            </span>
          </div>
          {onLogout && (
            <button onClick={onLogout} className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:scale-105 transition-all" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content — NO SIDEBAR */}
      <main className="flex-1 relative overflow-hidden bg-transparent">
        
        {/* ═══════════════════════════════════════════════════════ */}
        {/* COMMAND DASHBOARD — Grid of all module cards + Radar   */}
        {/* ═══════════════════════════════════════════════════════ */}
        {isHome && (
          <div className="absolute inset-0 p-4 lg:p-5 xl:p-6 z-20 h-full grid grid-cols-[1fr_minmax(0,1.2fr)_1fr] grid-rows-[auto_1fr_auto] gap-3 lg:gap-4 xl:gap-5 min-h-0">
            
            {/* ── ROW 1, COL 1: Command Terminal ── */}
            <div className={`glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col gap-3 ${hc}`}>
              <div>
                <h2 className="text-base font-semibold text-slate-100 tracking-wide">Command Terminal</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Simulation Control</p>
              </div>
              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                {/* AI Model / Policy Selector */}
                <div className="flex items-center justify-between text-[10px] bg-[#0b1119] border border-[#ffffff10] rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 font-medium">Model:</span>
                  <select
                    value={activePolicy}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      setActivePolicy(p);
                      api.scheduler.updateConfig(p);
                      toast.info(`Active model set to: ${p.toUpperCase()}`);
                    }}
                    className="bg-transparent text-[#00E5FF] font-semibold text-[10px] focus:outline-none cursor-pointer"
                  >
                    <option value="bandit" className="bg-[#0b1119] text-white">Bandit (MVP)</option>
                    <option value="q_learning" className="bg-[#0b1119] text-white">Q-Learning (V1)</option>
                    <option value="dqn" className="bg-[#0b1119] text-white">DQN (V2)</option>
                    <option value="baseline" className="bg-[#0b1119] text-white">Baseline (Round Robin)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  {isRunning ? (
                    <button onClick={handlePause} className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-lg hover:bg-rose-500/30 hover:scale-[1.02] shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all text-xs">
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  ) : (
                    <button onClick={handlePlay} className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 rounded-lg hover:bg-[#00E5FF]/30 hover:scale-[1.02] shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-all text-xs">
                      <Play className="w-3.5 h-3.5" /> Initialize
                    </button>
                  )}
                  <button onClick={handleReset} className="px-2.5 py-1.5 flex items-center justify-center gap-1 bg-slate-500/20 text-slate-300 border border-slate-500/50 rounded-lg hover:bg-slate-500/30 hover:scale-[1.02] transition-all text-xs" title="Reset Simulation">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={handleRandomScenario} className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg hover:bg-indigo-500/30 hover:border-indigo-400 hover:scale-[1.02] shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Randomize & Run
                </button>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono border-t border-[#ffffff15] pt-2">
                <span>Status</span>
                <span className={`font-bold ${activeSimulation?.status === 'running' ? 'text-emerald-400' : 'text-[#00E5FF]'}`}>
                  {activeSimulation?.status?.toUpperCase() || 'IDLE'}
                </span>
              </div>
            </div>

            {/* ── ROW 1, COL 2: Live Telemetry (horizontal) ── */}
            <div className={`glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col ${hc}`}>
              <span className="text-xs font-semibold text-slate-200 mb-2">Live Telemetry</span>
              <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">
                {[
                  { label: 'Pd', value: liveMetrics?.pd, pct: true, color: '#00E5FF' },
                  { label: 'Pfa', value: liveMetrics?.pfa, pct: true, color: '#f43f5e' },
                  { label: 'Reward', value: liveMetrics?.reward, pct: false, unit: '', color: '#fbbf24' },
                  { label: 'AIT', value: liveMetrics?.ait, pct: false, unit: 'ms', color: '#a78bfa' },
                  { label: 'Efficiency', value: liveMetrics?.scan_efficiency, pct: true, color: '#34d399' },
                ].map((m) => (
                  <div key={m.label} className="bg-[#0b1119]/80 rounded-xl p-2 border border-[#ffffff08] flex flex-col justify-between hover:bg-[#121b26] transition-colors">
                    <span className="text-[9px] text-slate-500 font-medium">{m.label}</span>
                    <span className="text-lg font-light mt-1" style={{ color: m.color }}>
                      {m.value !== undefined ? (m.pct ? (m.value * 100).toFixed(1) + '%' : m.value.toFixed(1) + (m.unit || '')) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ROW 1, COL 3: Detections Gauge ── */}
            <div className={`glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden ${hc}`}>
              <span className="text-[10px] text-slate-500 font-semibold absolute top-4 left-4">Detections</span>
              <svg className="w-[100px] h-[100px]" viewBox="0 0 100 100">
                <path d="M 15 85 A 40 40 0 0 1 85 85" fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth="1.5" strokeDasharray="2 4" strokeLinecap="round" />
                <path d="M 15 85 A 40 40 0 0 1 85 85" fill="none" stroke="#00E5FF" strokeWidth="2.5" strokeDasharray={`${Math.min(detections.length, 120)} 200`} strokeDashoffset="-30" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px #00E5FF)' }} />
              </svg>
              <span className="text-3xl font-light text-slate-100 drop-shadow-md -mt-4">{detections.length}</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Total Events</span>
            </div>

            {/* ── ROW 2, COL 1: Left stack (Simulations + Emitters + Scheduler) ── */}
            <div className="flex flex-col gap-3 lg:gap-4 min-h-0">
              
              {/* Simulations Card */}
              <div onClick={() => navigateTo('simulations')} className={`flex-1 min-h-0 glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col group ${hc}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><ShieldAlert className="w-4 h-4 text-[#00E5FF]" /> Simulations</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#ffffff08]">
                      <span className="text-[9px] text-slate-500 block">Total</span>
                      <span className="text-xl font-light text-slate-100">{simulations.length}</span>
                    </div>
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-emerald-500/10">
                      <span className="text-[9px] text-emerald-400 block">Running</span>
                      <span className="text-xl font-light text-emerald-300">{runningSims}</span>
                    </div>
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#00E5FF]/10">
                      <span className="text-[9px] text-[#00E5FF] block">Done</span>
                      <span className="text-xl font-light text-[#00E5FF]">{completedSims}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-600 mt-2 font-mono">Active: {activeSimulation?.name || 'None'}</span>
                </div>
              </div>

              {/* Emitters & Receiver Card */}
              <div onClick={() => navigateTo('emitters')} className={`flex-1 min-h-0 glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col group ${hc}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><Radio className="w-4 h-4 text-[#00E5FF]" /> Emitters & Receiver</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#ffffff08]">
                      <span className="text-[9px] text-slate-500 block">Sources</span>
                      <span className="text-xl font-light text-slate-100">{emitters.length}</span>
                    </div>
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#00E5FF]/10">
                      <span className="text-[9px] text-[#00E5FF] block">Active Bands</span>
                      <span className="text-xl font-light text-[#00E5FF]">{activeBands}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {tunedBands.slice(0, 8).map(b => (
                      <span key={b} className="text-[8px] px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 font-mono">B{b}</span>
                    ))}
                    {tunedBands.length > 8 && <span className="text-[8px] text-slate-500">+{tunedBands.length - 8}</span>}
                  </div>
                </div>
              </div>

              {/* Scheduler Card */}
              <div onClick={() => navigateTo('scheduler')} className={`flex-1 min-h-0 glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col group ${hc}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><CheckCircle2 className="w-4 h-4 text-[#00E5FF]" /> AI Scheduler</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#ffffff08] flex-1">
                      <span className="text-[9px] text-slate-500 block">Decisions</span>
                      <span className="text-xl font-light text-slate-100">{decisionHistory.length}</span>
                    </div>
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#00E5FF]/10 flex-1">
                      <span className="text-[9px] text-[#00E5FF] block">Last Band</span>
                      <span className="text-xl font-light text-[#00E5FF]">{latestDecision?.action?.next_band ?? '—'}</span>
                    </div>
                  </div>
                  {latestDecision && (
                    <span className="text-[9px] text-slate-600 mt-2 font-mono truncate">ID: {latestDecision.decision_id}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── ROW 2, COL 2: Radar (center) ── */}
            <div className="glass-soc-card rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden min-h-0 transition-all duration-500 hover:shadow-[0_20px_60px_-10px_rgba(0,229,255,0.2)]">
              <div className="absolute inset-0 flex items-center justify-center opacity-90">
                <Radar />
              </div>
            </div>

            {/* ── ROW 2, COL 3: Right stack (Experiments + Models + Metrics) ── */}
            <div className="flex flex-col gap-3 lg:gap-4 min-h-0">
              
              {/* Experiments Card */}
              <div onClick={() => navigateTo('experiments')} className={`flex-1 min-h-0 glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col group ${hc}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><Layers className="w-4 h-4 text-[#00E5FF]" /> Experiments</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#ffffff08]">
                      <span className="text-[9px] text-slate-500 block">Total</span>
                      <span className="text-xl font-light text-slate-100">{experiments.length}</span>
                    </div>
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-emerald-500/10">
                      <span className="text-[9px] text-emerald-400 block">Running</span>
                      <span className="text-xl font-light text-emerald-300">{runningExperiments}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Models & Training Card */}
              <div onClick={() => navigateTo('models')} className={`flex-1 min-h-0 glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col group ${hc}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><Cpu className="w-4 h-4 text-[#00E5FF]" /> Models & Training</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#ffffff08]">
                      <span className="text-[9px] text-slate-500 block">Total</span>
                      <span className="text-xl font-light text-slate-100">{models.length}</span>
                    </div>
                    <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#00E5FF]/10">
                      <span className="text-[9px] text-[#00E5FF] block">Active</span>
                      <span className="text-xl font-light text-[#00E5FF]">{activeModelsCount}</span>
                    </div>
                  </div>
                  {trainingProgress && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                        <span>Training: {trainingProgress.job_id.slice(-6)}</span>
                        <span className="text-[#00E5FF]">{(trainingProgress.progress * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1 bg-[#ffffff10] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] transition-all" style={{ width: `${trainingProgress.progress * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics Card */}
              <div onClick={() => navigateTo('metrics')} className={`flex-1 min-h-0 glass-soc-card rounded-2xl p-4 shadow-2xl flex flex-col group ${hc}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><BarChart2 className="w-4 h-4 text-[#00E5FF]" /> Metrics</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="bg-[#0b1119]/80 rounded-lg p-2 border border-[#ffffff08]">
                    <span className="text-[9px] text-slate-500 block">Live, Experiment & Comparison metrics</span>
                    <span className="text-sm font-light text-slate-300 mt-1">Sim: {activeSimulation?.name || 'None'}</span>
                  </div>
                  <span className="text-[9px] text-slate-600 mt-2 font-mono">Experiments: {experiments.length} available</span>
                </div>
              </div>
            </div>

            {/* ── ROW 3, COL 1: WebSocket Harness ── */}
            <div onClick={() => navigateTo('websocket')} className={`glass-soc-card rounded-2xl p-3 shadow-2xl flex items-center justify-between group ${hc}`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${wsState === 'CONNECTED' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                  <Terminal className="w-3.5 h-3.5 text-[#00E5FF]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-200">WebSocket Harness</span>
                  <span className="text-[9px] text-slate-500">{wsLogs.length} log entries</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${wsState === 'CONNECTED' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                  {wsState}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* ── ROW 3, COL 2: (empty spacer under radar) ── */}
            <div />

            {/* ── ROW 3, COL 3: Regression Pass ── */}
            <div onClick={() => navigateTo('regression')} className={`glass-soc-card rounded-2xl p-3 shadow-2xl flex items-center justify-between group ${hc}`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#00E5FF]/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-200">Regression Tests</span>
                  <span className="text-[9px] text-slate-500">API endpoint health checks</span>
                </div>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SUB-PAGES — shown when not on home dashboard           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {!isHome && (
          <div className="absolute inset-0 p-6 z-30 overflow-y-auto custom-scrollbar">
            {activeTab === 'simulations' && <Simulations />}
            {activeTab === 'emitters' && <EmittersReceiver />}
            {activeTab === 'scheduler' && <Scheduler />}
            {activeTab === 'experiments' && <Experiments />}
            {activeTab === 'models' && <ModelsTraining />}
            {activeTab === 'metrics' && <Metrics />}
            {activeTab === 'websocket' && <WSHarness />}
            {activeTab === 'regression' && <RegressionPass />}
          </div>
        )}
        
      </main>
    </div>
  );
}