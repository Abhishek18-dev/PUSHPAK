import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Calendar, 
  Sliders, 
  Play, 
  Square, 
  Activity, 
  Zap, 
  Clock, 
  Radio, 
  Cpu, 
  History, 
  FileCode,
  Sparkles,
  Shield
} from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../services/api';
import type { PolicyType } from '../types';

export const Scheduler: React.FC = () => {
  const { 
    latestDecision, 
    decisionHistory, 
    wsState, 
    activePolicy, 
    setActivePolicy,
    activeSimulationId,
    updateSimulationStatus 
  } = useAppStore();

  const [schedulerStatus, setSchedulerStatus] = useState<any>({ policy: activePolicy, step_count: 0, running: false });

  const fetchSchedulerStatus = async () => {
    const res = await api.scheduler.getStatus();
    if (res.success && res.data) {
      setSchedulerStatus(res.data);
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
  }, []);

  const handlePolicyChange = async (newPolicy: PolicyType) => {
    setActivePolicy(newPolicy);
    const res = await api.scheduler.updateConfig(newPolicy);
    if (res.success) {
      setSchedulerStatus((prev: any) => ({ ...prev, policy: newPolicy }));
      toast.success(`Active policy set to ${newPolicy.toUpperCase()}!`);
    } else {
      toast.error(`Failed to update policy: ${res.error?.message}`);
    }
  };

  const handleStartScheduler = async () => {
    if (activeSimulationId) {
      updateSimulationStatus(activeSimulationId, 'running');
      await api.simulations.start(activeSimulationId, activePolicy);
      setSchedulerStatus((prev: any) => ({ ...prev, running: true, policy: activePolicy }));
      toast.success(`Simulation active with ${activePolicy.toUpperCase()} policy!`);
    } else {
      const res = await api.scheduler.start();
      if (res.success) {
        setSchedulerStatus((prev: any) => ({ ...prev, running: true }));
        toast.success('Scheduler loop started');
      } else {
        toast.error(`Failed to start: ${res.error?.message}`);
      }
    }
  };

  const handleStopScheduler = async () => {
    if (activeSimulationId) {
      updateSimulationStatus(activeSimulationId, 'paused');
      await api.simulations.stop(activeSimulationId);
      setSchedulerStatus((prev: any) => ({ ...prev, running: false }));
      toast.warning('Simulation paused');
    } else {
      const res = await api.scheduler.stop();
      if (res.success) {
        setSchedulerStatus((prev: any) => ({ ...prev, running: false }));
        toast.warning('Scheduler loop stopped');
      } else {
        toast.error(`Failed to stop: ${res.error?.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none font-sans pb-10">
      
      {/* ── HEADER TITLE ── */}
      <div className="flex items-center justify-between pb-3 -green-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center -green-500/30">
            <Sliders className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-tactical font-extrabold tracking-wider text-white">
                AI SCAN SCHEDULER & CONTROL LOOP
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono bg-green-500/15 text-green-300 -green-500/30 font-bold">
                RL DECISION STREAM
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">ACTIVE POLICY:</span>
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 -green-500/40 text-xs font-mono font-bold uppercase shadow-[0_0_12px_rgba(34,197,94,0.25)]">
            {activePolicy.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* ── 2-COLUMN BENTO LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: POLICY & SCHEDULER CONTROLLER (col-span-5) */}
        <div className="lg:col-span-5 bento-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 -white/5">
              <Sparkles className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                Select Active Scan Strategy
              </h3>
            </div>

            {/* Policy Selector Options */}
            <div className="space-y-2 mb-6">
              {[
                { id: 'bandit', name: 'Multi-Armed Bandit (Exp3)' },
                { id: 'q_learning', name: 'Tabular Q-Learning (V1)' },
                { id: 'dqn', name: 'Deep Q-Network (V2)' },
                { id: 'baseline', name: 'Baseline (Round Robin)' },
              ].map((p) => {
                const isSelected = activePolicy === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handlePolicyChange(p.id as PolicyType)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-green-500/20 -green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.25)] text-white'
                        : 'bg-white/[0.02] -white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <strong className={isSelected ? 'text-green-300' : 'text-slate-300'}>{p.name}</strong>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#22c55e]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scheduler Control Buttons */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-300 uppercase font-semibold">
                EXECUTION CONTROL
              </span>
              <div className="flex gap-3">
                <button
                  onClick={handleStartScheduler}
                  className="flex-1 py-2.5 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  INITIALIZE RUN
                </button>
                <button
                  onClick={handleStopScheduler}
                  className="flex-1 py-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 -rose-500/40 text-rose-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(244,63,94,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  PAUSE RUN
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bento-tile font-mono text-xs space-y-1">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">
              STATUS TELEMETRY VECTOR
            </span>
            <div className="flex justify-between text-[10px] text-slate-300">
              <span>ACTIVE POLICY:</span>
              <strong className="text-green-400 uppercase">{activePolicy}</strong>
            </div>
            <div className="flex justify-between text-[10px] text-slate-300">
              <span>DECISION LATENCY:</span>
              <strong className="text-green-400">&lt; 12 ms (Target: 50ms)</strong>
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE DECISION STREAM & TIMELINE (col-span-7) */}
        <div className="lg:col-span-7 bento-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-2 mb-4 -white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                  Live AI Scan Decision Stream
                </h3>
              </div>
              <span className="text-[9px] font-mono text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full -green-500/30 font-bold">
                STREAMING
              </span>
            </div>

            {/* Latest Decision Card */}
            <div className="mb-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold mb-2 block">
                Latest Decision (GET /scheduler/decision)
              </span>
              {latestDecision ? (
                <div className="p-3.5 rounded-2xl bento-tile font-mono text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>NEXT SCAN TARGET:</span>
                    <strong className="text-green-400 text-sm">BAND #{latestDecision.action?.next_band}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>DWELL TIME:</span>
                    <strong className="text-white">{latestDecision.action?.dwell_time || 10} ms</strong>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>POLICY / MODEL ID:</span>
                    <strong className="text-amber-300 uppercase">{latestDecision.model_id || activePolicy}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bento-tile text-xs font-mono text-slate-400 text-center">
                  Awaiting decision ticks. Initialize simulation to begin streaming.
                </div>
              )}
            </div>

            {/* Decision History Table */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold mb-2 block flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-green-400" />
                Decision Diary ({decisionHistory.length} Logged)
              </span>
              {decisionHistory.length === 0 ? (
                <div className="p-4 rounded-2xl bento-tile text-xs font-mono text-slate-400 text-center">
                  No decision events recorded yet.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-2xl -white/10 custom-scrollbar">
                  <table className="w-full text-left -collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-white/[0.04] text-[10px] text-slate-400 uppercase tracking-wider -white/10 sticky top-0 backdrop-blur-md">
                        <th className="py-2.5 px-3">Decision ID</th>
                        <th className="py-2.5 px-3">Next Band</th>
                        <th className="py-2.5 px-3">Dwell</th>
                        <th className="py-2.5 px-3">Policy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {decisionHistory.map((dec, i) => (
                        <tr key={`${dec.decision_id}-${i}`} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-2.5 px-3 text-green-400 font-bold">
                            DEC-{dec.decision_id ? dec.decision_id.slice(-4) : i + 1}
                          </td>
                          <td className="py-2.5 px-3 text-white font-bold">
                            Band #{dec.action?.next_band}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                            {dec.action?.dwell_time || 10} ms
                          </td>
                          <td className="py-2.5 px-3 text-amber-300 uppercase text-[10px]">
                            {dec.model_id || activePolicy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Scheduler;