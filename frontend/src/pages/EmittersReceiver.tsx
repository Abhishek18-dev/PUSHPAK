import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, 
  Cpu, 
  Plus, 
  Trash2, 
  Save, 
  Scan, 
  AlertTriangle, 
  AlertCircle, 
  Layers, 
  Sliders, 
  Clock, 
  Activity, 
  Gauge, 
  Zap 
} from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../services/api';
import type { BehaviorClass } from '../types';

export const EmittersReceiver: React.FC = () => {
  const { activeSimulationId, errorMsg } = useAppStore();

  // Emitter CRUD States
  const [behaviorClass, setBehaviorClass] = useState<BehaviorClass>('fixed');
  const [band, setBand] = useState(0);
  const [period, setPeriod] = useState(10);
  const [priority, setPriority] = useState(1);
  const [emitters, setEmitters] = useState<any[]>([]);

  // Receiver Config States
  const [bandwidthK, setBandwidthK] = useState(2);
  const [dwellMs, setDwellMs] = useState(10);
  const [tuningDelay, setTuningDelay] = useState(5);
  const [threshold, setThreshold] = useState(15.0);

  // Scan states
  const [rawScanResult, setRawScanResult] = useState<any>(null);

  const fetchSimulationEmitters = async () => {
    if (!activeSimulationId) return;
    const res = await api.simulations.get(activeSimulationId);
    if (res.success && res.data && res.data.emitters) {
      setEmitters(res.data.emitters);
    }
  };

  const loadReceiverConfig = async () => {
    const res = await api.receiver.getStatus();
    if (res.success && res.data) {
      setBandwidthK(res.data.bandwidth_k || 2);
      setDwellMs(res.data.dwell_ms || 10);
      setTuningDelay(res.data.tuning_delay || 5);
      setThreshold(res.data.threshold || 15.0);
    }
  };

  useEffect(() => {
    if (activeSimulationId) {
      fetchSimulationEmitters();
    }
    loadReceiverConfig();
  }, [activeSimulationId]);

  const handleCreateEmitter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSimulationId) {
      alert('Please activate a simulation first.');
      return;
    }
    const res = await api.emitters.create({
      simulation_id: activeSimulationId,
      behavior_class: behaviorClass,
      band,
      period,
      priority,
    });
    if (res.success) {
      fetchSimulationEmitters();
    } else {
      alert(`Failed: ${res.error?.message}`);
    }
  };

  const handleDeleteEmitter = async (id: string) => {
    const res = await api.emitters.delete(id);
    if (res.success) {
      fetchSimulationEmitters();
    } else {
      alert(`Delete failed: ${res.error?.message}`);
    }
  };

  const handleUpdateReceiverConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.receiver.updateConfig({
      bandwidth_k: bandwidthK,
      dwell_ms: dwellMs,
      tuning_delay: tuningDelay,
      threshold,
    });
    if (res.success) {
      alert('Receiver config updated successfully!');
    } else {
      alert(`Failed to update config: ${res.error?.message}`);
    }
  };

  const handleManualScan = async () => {
    const res = await api.receiver.scan();
    if (res.success) {
      setRawScanResult(res.data);
    } else {
      alert(`Scan failed: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-400" />
            Emitters & Receiver Config
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure and inspect Level 4 spectrum emitters and receiver parameters.</p>
        </div>
      </div>

      {/* Warnings & Errors */}
      {!activeSimulationId && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>No active simulation selected. Standard CRUD actions will require activating a simulation in the first tab.</span>
        </motion.div>
      )}

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
        
        {/* Emitter Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Manage Emitters
            </h3>
            
            <form onSubmit={handleCreateEmitter} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Behavior Class
                  </label>
                  <select 
                    value={behaviorClass} 
                    onChange={e => setBehaviorClass(e.target.value as BehaviorClass)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="periodic">Periodic</option>
                    <option value="agile">Agile</option>
                    <option value="random">Random</option>
                    <option value="intermittent">Intermittent</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    Target Band ID
                  </label>
                  <input 
                    type="number" 
                    value={band} 
                    onChange={e => setBand(Number(e.target.value))} 
                    min={0} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Period (Periodic Only)
                  </label>
                  <input 
                    type="number" 
                    value={period} 
                    onChange={e => setPeriod(Number(e.target.value))} 
                    min={1} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                    Priority Multiplier
                  </label>
                  <input 
                    type="number" 
                    value={priority} 
                    onChange={e => setPriority(Number(e.target.value))} 
                    min={1} 
                    step={0.5} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={!activeSimulationId}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Emitter
              </button>
            </form>

            <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">Active Emitters</h4>
            {emitters.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No emitters defined yet.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Behavior</th>
                      <th className="py-2.5 px-3">Band</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {emitters.map(emit => (
                      <tr key={emit.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400"><code>{emit.id}</code></td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {emit.behavior_class}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{emit.band}</td>
                        <td className="py-2.5 px-3 text-slate-300">{emit.period || 'N/A'}</td>
                        <td className="py-2.5 px-3 text-slate-300">{emit.priority || 1.0}</td>
                        <td className="py-2.5 px-3">
                          <button 
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 transition-colors flex items-center gap-1 cursor-pointer"
                            onClick={() => handleDeleteEmitter(emit.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
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

        {/* Receiver Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Receiver Configuration
            </h3>

            <form onSubmit={handleUpdateReceiverConfig} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    Bandwidth (k)
                  </label>
                  <input 
                    type="number" 
                    value={bandwidthK} 
                    onChange={e => setBandwidthK(Number(e.target.value))} 
                    min={1} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Dwell Time (ms)
                  </label>
                  <input 
                    type="number" 
                    value={dwellMs} 
                    onChange={e => setDwellMs(Number(e.target.value))} 
                    min={1} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Tuning Delay (ms)
                  </label>
                  <input 
                    type="number" 
                    value={tuningDelay} 
                    onChange={e => setTuningDelay(Number(e.target.value))} 
                    min={0} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    Detection Threshold (dB)
                  </label>
                  <input 
                    type="number" 
                    value={threshold} 
                    onChange={e => setThreshold(Number(e.target.value))} 
                    step={0.1} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                PUT /receiver/config
              </button>
            </form>

            <div className="border-t border-slate-800/80 pt-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Scan className="w-4 h-4 text-indigo-400" />
                Manual Scan Debug
              </h3>
              <button 
                onClick={handleManualScan} 
                className="w-full mb-4 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scan className="w-4 h-4 text-indigo-400" />
                POST /receiver/scan (Perform Single Scan Step)
              </button>
              
              <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Raw Observation Response</h4>
              {rawScanResult ? (
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-40">
                  {JSON.stringify(rawScanResult, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-slate-500 italic">No manual scan performed yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};