import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  FileCode 
} from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../services/api';
import type { PolicyType } from '../types';

export const Scheduler: React.FC = () => {
  const { latestDecision, decisionHistory, wsState } = useAppStore();
  const [policy, setPolicy] = useState<PolicyType>('baseline');
  const [schedulerStatus, setSchedulerStatus] = useState<any>({ policy: 'baseline', step_count: 0, running: false });

  const fetchSchedulerStatus = async (isInitial = false) => {
    const res = await api.scheduler.getStatus();
    if (res.success && res.data) {
      setSchedulerStatus(res.data);
      if (isInitial && res.data.policy) {
        setPolicy(res.data.policy);
      }
    }
  };

  useEffect(() => {
    fetchSchedulerStatus(true);
    
    // Poll scheduler status every 3 seconds
    const id = setInterval(() => {
      fetchSchedulerStatus(false);
    }, 3000);

    return () => clearInterval(id);
  }, []);

  const handlePolicyChange = async (newPolicy: PolicyType) => {
    setPolicy(newPolicy);
    const res = await api.scheduler.updateConfig(newPolicy);
    if (res.success) {
      setSchedulerStatus((prev: any) => ({ ...prev, policy: newPolicy }));
      toast.success(`Active policy changed to ${newPolicy.toUpperCase()}`);
    } else {
      toast.error(`Failed to update policy: ${res.error?.message}`);
    }
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePolicyChange(policy);
  };

  const handleStartScheduler = async () => {
    const res = await api.scheduler.start();
    if (res.success) {
      setSchedulerStatus((prev: any) => ({ ...prev, running: true }));
      toast.success('Scheduler service started');
    } else {
      toast.error(`Failed to start: ${res.error?.message}`);
    }
  };

  const handleStopScheduler = async () => {
    const res = await api.scheduler.stop();
    if (res.success) {
      setSchedulerStatus((prev: any) => ({ ...prev, running: false }));
      toast.warning('Scheduler service stopped');
    } else {
      toast.error(`Failed to stop: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Scheduler Configuration & Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Control spectrum scheduling policies and inspect live RL/decision streams (Level 5).</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scheduler Control Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Policy & Control
            </h3>

            <form onSubmit={handleUpdatePolicy} className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  Select Scheduler Policy
                </label>
                <select 
                  value={policy} 
                  onChange={e => handlePolicyChange(e.target.value as PolicyType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="baseline">Baseline (Fixed Round Robin)</option>
                  <option value="bandit">Multi-Armed Bandit (MVP)</option>
                  <option value="q_learning">Tabular Q-Learning (V1)</option>
                  <option value="dqn">Deep Q-Network (V2)</option>
                  <option value="ppo">PPO (V2)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                PUT /scheduler/config
              </button>
            </form>

            <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Scheduler Control Loop
            </h4>
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleStartScheduler}
                disabled={schedulerStatus.running}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Start Scheduler
              </button>
              <button
                onClick={handleStopScheduler}
                disabled={!schedulerStatus.running}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4" />
                Stop Scheduler
              </button>
            </div>

            <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Current Status Vector
            </h4>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-40">
              {JSON.stringify(schedulerStatus, null, 2)}
            </pre>
          </div>
        </div>

        {/* Decisions Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Live Decision Stream
            </h3>

            <div className="mb-6">
              <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Latest Decision (GET /scheduler/decision)</h4>
              {latestDecision ? (
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-36">
                  {JSON.stringify(latestDecision, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  No active decision received. {wsState === 'CONNECTED' ? 'Waiting for steps...' : 'Connect WebSocket to stream.'}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                Decision History Log (GET /scheduler/history)
              </h4>
              {decisionHistory.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No decision history recorded.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider sticky top-0">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Next Band</th>
                        <th className="py-2.5 px-3">Dwell</th>
                        <th className="py-2.5 px-3">Model ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {decisionHistory.map((dec, i) => (
                        <tr key={`${dec.decision_id}-${i}`} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-400">
                            <code>{dec.decision_id.slice(-6)}</code>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{dec.action.next_band}</td>
                          <td className="py-2.5 px-3 text-slate-300">{dec.action.dwell_time || 'Default'}</td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">{dec.model_id || 'baseline'}</td>
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