import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  List, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  AlertCircle, 
  Radio,
  Sliders,
  Clock,
  Key,
  Activity,
  Zap,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store';
import { api } from '../services/api';

export const Simulations: React.FC = () => {
  const {
    simulations,
    activeSimulationId,
    fetchSimulations,
    setActiveSimulation,
    createSimulation,
    deleteSimulation,
    updateSimulationStatus,
    errorMsg,
  } = useAppStore();

  const [name, setName] = useState('Sector Bravo Run');
  const [bands, setBands] = useState(16);
  const [duration, setDuration] = useState(2000);
  const [seed, setSeed] = useState(42);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSimulations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createSimulation(name, bands, duration, seed);
    if (success) {
      toast.success('Simulation environment provisioned!');
      setActiveTab('list');
    }
  };

  const handleStart = async (id: string) => {
    updateSimulationStatus(id, 'running');
    const res = await api.simulations.start(id, useAppStore.getState().activePolicy);
    if (!res.success) {
      updateSimulationStatus(id, 'draft');
      toast.error(`Start failed: ${res.error?.message}`);
    } else {
      toast.success('Simulation running!');
    }
  };

  const handleStop = async (id: string) => {
    updateSimulationStatus(id, 'paused');
    toast.warning('Simulation paused.');
    const res = await api.simulations.stop(id);
    if (!res.success) {
      updateSimulationStatus(id, 'running');
      toast.error(`Stop failed: ${res.error?.message}`);
    }
  };

  const handleReset = async (id: string) => {
    updateSimulationStatus(id, 'draft');
    toast.info('Simulation reset to step 0.');
    const res = await api.simulations.reset(id);
    if (!res.success) {
      toast.error(`Reset failed: ${res.error?.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this simulation environment?')) {
      await deleteSimulation(id);
      toast.success('Simulation deleted.');
    }
  };

  const filteredSimulations = simulations.filter((sim) => {
    if (statusFilter === 'all') return true;
    return sim.status === statusFilter;
  });

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
                SIMULATION SECTORS MANAGER
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono bg-green-500/15 text-green-300 -green-500/30 font-bold">
                GROUND TRUTH ENGINE
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/[0.04] p-1 rounded-full text-xs font-mono">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-green-500/20 text-green-300 font-bold shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" /> All Sectors ({simulations.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-green-500/20 text-green-300 font-bold shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> New Sector
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 -rose-500/20 text-rose-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── CREATE NEW SIMULATION TAB ── */}
      {activeTab === 'create' ? (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 pb-2 -white/5">
            <Plus className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-tactical font-bold text-white uppercase tracking-wider">
              Provision New Simulation Sector
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-300">SECTOR CODENAME</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:-green-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-300">FREQUENCY BANDS</label>
                <select
                  value={bands}
                  onChange={e => setBands(Number(e.target.value))}
                  className="w-full bg-[#050e08] border border-green-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-green-400 cursor-pointer"
                >
                  <option value={16} className="bg-[#040c07] text-white">16 Bands (Standard EW)</option>
                  <option value={24} className="bg-[#040c07] text-white">24 Bands (Extended Wideband)</option>
                  <option value={32} className="bg-[#040c07] text-white">32 Bands (Ultra-Dense Grid)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-300">DURATION (STEPS)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  min={100}
                  max={10000}
                  className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:-green-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-300">RANDOM SEED</label>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(Number(e.target.value))}
                className="w-full bg-transparent backdrop-blur-sm -green-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:-green-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <Plus className="w-4 h-4" />
              CREATE SIMULATION ENVIRONMENT
            </button>
          </form>
        </div>
      ) : (
        /* ── ALL SIMULATIONS LIST TAB ── */
        <div className="space-y-4">
          
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] font-mono text-slate-400">FILTER STATUS:</span>
              {['all', 'running', 'paused', 'draft'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-green-500/20 text-green-300 -green-500/40 font-bold'
                      : 'bg-white/[0.02] text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Showing {filteredSimulations.length} sectors
            </span>
          </div>

          {/* Simulations Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSimulations.map(sim => {
              const isActive = activeSimulationId === sim.id;
              const isRunning = sim.status === 'running';

              return (
                <div
                  key={sim.id}
                  onClick={() => setActiveSimulation(sim.id)}
                  className={`p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    isActive
                      ? '-green-400/60 shadow-[0_0_20px_rgba(34,197,94,0.2)] bg-green-950/[0.06]'
                      : '-white/5 hover:-green-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-tactical font-bold text-sm text-white tracking-wider">
                        {sim.name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        isRunning ? 'bg-green-500/20 text-green-300 -green-500/40 animate-pulse' : 'bg-white/5 text-slate-400'
                      }`}>
                        {sim.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono py-2">
                      <div className="p-2 bg-white/[0.02] rounded-xl">
                        <span className="text-[8px] text-slate-400 block">BANDS</span>
                        <strong className="text-white">{sim.bands}</strong>
                      </div>
                      <div className="p-2 bg-white/[0.02] rounded-xl">
                        <span className="text-[8px] text-slate-400 block">DURATION</span>
                        <strong className="text-green-300">{sim.duration_steps}</strong>
                      </div>
                      <div className="p-2 bg-white/[0.02] rounded-xl">
                        <span className="text-[8px] text-slate-400 block">STEP</span>
                        <strong className="text-amber-300">{sim.current_step ?? 0}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 -white/5">
                    <div className="flex items-center gap-1.5">
                      {isRunning ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStop(sim.id); }}
                          className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 -rose-500/40 text-rose-300 hover:bg-rose-500/30 flex items-center gap-1"
                        >
                          <Square className="w-3 h-3" /> PAUSE
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStart(sim.id); }}
                          className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/20 -green-500/40 text-green-300 hover:bg-green-500/30 flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> RUN
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleReset(sim.id); }}
                        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300"
                        title="Reset"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(sim.id); }}
                      className="p-1.5 rounded-full hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Simulations;