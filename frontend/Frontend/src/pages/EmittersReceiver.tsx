import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
    fetchSimulationEmitters();
    loadReceiverConfig();
  }, [activeSimulationId]);

  const handleCreateEmitter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSimulationId) {
      toast.error('Activate a simulation sector first.');
      return;
    }
    const res = await api.emitters.create({
      simulation_id: activeSimulationId,
      band,
      behavior_class: behaviorClass,
      period: behaviorClass === 'periodic' ? period : undefined,
      priority,
    });
    if (res.success) {
      toast.success('Tactical emitter spawned!');
      fetchSimulationEmitters();
    } else {
      toast.error(`Failed: ${res.error?.message}`);
    }
  };

  const handleDeleteEmitter = async (emitterId: string) => {
    if (!activeSimulationId) return;
    const res = await api.emitters.delete(emitterId);
    if (res.success) {
      toast.success('Emitter removed.');
      fetchSimulationEmitters();
    } else {
      toast.error(`Delete failed: ${res.error?.message}`);
    }
  };

  const handleUpdateReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.receiver.updateConfig({
      bandwidth_k: bandwidthK,
      dwell_ms: dwellMs,
      tuning_delay: tuningDelay,
      threshold,
    });
    if (res.success) {
      toast.success('Receiver hardware parameters committed!');
    } else {
      toast.error(`Update failed: ${res.error?.message}`);
    }
  };

  const handleExecuteScan = async () => {
    toast.info('Executing instant receiver hardware scan...');
    const res = await api.receiver.scan();
    if (res.success && res.data) {
      setRawScanResult(res.data);
      toast.success('Scan frames captured!');
    } else {
      toast.error(`Scan failed: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none font-sans pb-10">
      
      {/* ── HEADER TITLE ── */}
      <div className="flex items-center justify-between pb-3 -green-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center -green-500/30">
            <Radio className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-tactical font-extrabold tracking-wider text-white">
                EMITTERS CATALOG & RECEIVER HARDWARE SPECS
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono bg-green-500/15 text-green-300 -green-500/30 font-bold">
                PHYSICAL LAYER
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleExecuteScan}
          className="px-5 py-2 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] flex items-center gap-2 cursor-pointer"
        >
          <Scan className="w-4 h-4" />
          TRIGGER INSTANT HARDWARE SCAN
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 -rose-500/20 text-rose-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 2-COLUMN HARDWARE INTERFACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: EMITTER MANAGEMENT (col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Add Emitter Panel */}
          <div className="p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 -white/5">
              <Plus className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                Spawn Tactical Emitter
              </h3>
            </div>

            <form onSubmit={handleCreateEmitter} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300">BEHAVIOR CLASS</label>
                  <select
                    value={behaviorClass}
                    onChange={e => setBehaviorClass(e.target.value as BehaviorClass)}
                    className="w-full bg-[#050e08] border border-green-500/30 rounded-2xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-green-400 cursor-pointer"
                  >
                    <option value="fixed" className="bg-[#040c07] text-white">Fixed Radar (Continuous CW)</option>
                    <option value="periodic" className="bg-[#040c07] text-white">Periodic Radar (Pulsed Repetition)</option>
                    <option value="agile" className="bg-[#040c07] text-white">Frequency Agile (Hopping)</option>
                    <option value="intermittent" className="bg-[#040c07] text-white">Intermittent (Bursty)</option>
                    <option value="random" className="bg-[#040c07] text-white">Random Emitter (Stochastic)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300">CHANNEL BAND #</label>
                  <input
                    type="number"
                    value={band}
                    onChange={e => setBand(Number(e.target.value))}
                    min={0}
                    max={31}
                    className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:-green-400"
                  />
                </div>
              </div>

              {behaviorClass === 'periodic' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300">PULSE PERIOD (STEPS)</label>
                  <input
                    type="number"
                    value={period}
                    onChange={e => setPeriod(Number(e.target.value))}
                    min={2}
                    className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:-green-400"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                DEPLOY EMITTER TO SPECTRUM
              </button>
            </form>
          </div>

          {/* Active Emitters List */}
          <div className="p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 -white/5">
              <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                Sector Target Emitters ({emitters.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
              {emitters.length === 0 ? (
                <p className="text-xs font-mono text-slate-400 italic py-2">No active emitters found in sector.</p>
              ) : (
                emitters.map((e, idx) => (
                  <div
                    key={e.id || idx}
                    className="p-3 rounded-2xl bg-white/[0.02] -white/5 flex items-center justify-between font-mono text-xs"
                  >
                    <div>
                      <span className="text-green-400 font-bold">BAND #{e.band ?? idx}</span>
                      <span className="text-slate-400 ml-2 uppercase font-semibold text-[10px]">
                        {e.behavior_class || 'periodic'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteEmitter(e.id)}
                      className="p-1 rounded-full text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT: RECEIVER HARDWARE PARAMETERS (col-span-6) */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 pb-2 -white/5">
              <Sliders className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                Receiver Hardware Configuration
              </h3>
            </div>

            <form onSubmit={handleUpdateReceiver} className="space-y-4 font-mono text-xs pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300">TUNER BANDWIDTH (K)</label>
                  <input
                    type="number"
                    value={bandwidthK}
                    onChange={e => setBandwidthK(Number(e.target.value))}
                    min={1}
                    max={8}
                    className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:-green-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300">DWELL TIME (MS)</label>
                  <input
                    type="number"
                    value={dwellMs}
                    onChange={e => setDwellMs(Number(e.target.value))}
                    min={1}
                    className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:-green-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300">TUNING SLEW DELAY (MS)</label>
                  <input
                    type="number"
                    value={tuningDelay}
                    onChange={e => setTuningDelay(Number(e.target.value))}
                    min={1}
                    className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:-green-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-300">ENERGY THRESHOLD (DB)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:-green-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Save className="w-4 h-4" />
                UPDATE RECEIVER CONFIGURATION
              </button>
            </form>
          </div>

          {/* Raw Scan Frame */}
          {rawScanResult && (
            <div className="p-4 rounded-2xl bg-transparent -white/10 space-y-2">
              <span className="text-[10px] font-mono text-green-400 font-bold block">
                LATEST RECEIVER SCAN FRAME TELEMETRY
              </span>
              <pre className="text-[10px] font-mono text-green-300 overflow-x-auto max-h-40 custom-scrollbar">
                {JSON.stringify(rawScanResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default EmittersReceiver;