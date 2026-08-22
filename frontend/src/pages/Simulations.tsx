import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const [name, setName] = useState('Simulation Alpha');
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
      setActiveTab('list');
    }
  };

  const handleStart = async (id: string) => {
    updateSimulationStatus(id, 'running');
    const res = await api.simulations.start(id);
    if (!res.success) {
      updateSimulationStatus(id, 'draft');
      alert(`Start failed: ${res.error?.message}`);
    }
  };

  const handleStop = async (id: string) => {
    updateSimulationStatus(id, 'paused');
    const res = await api.simulations.stop(id);
    if (!res.success) {
      alert(`Stop failed: ${res.error?.message}`);
    }
  };

  const handleReset = async (id: string) => {
    updateSimulationStatus(id, 'draft');
    const res = await api.simulations.reset(id);
    if (!res.success) {
      alert(`Reset failed: ${res.error?.message}`);
    }
  };

  const filteredSimulations = simulations.filter(sim => {
    if (statusFilter === 'all') return true;
    return sim.status === statusFilter;
  });

  const runningCount = simulations.filter(s => s.status === 'running').length;
  const draftCount = simulations.filter(s => s.status === 'draft').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Simulation Control Panel</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage, monitor, and execute Level 2 & Level 3 RF spectrum simulations.</p>
            </div>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Running</p>
              <p className="text-sm font-bold text-white">{runningCount}</p>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-3">
            <Zap className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Drafts</p>
              <p className="text-sm font-bold text-white">{draftCount}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Banner */}
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

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'list' 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Simulations List
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-950/40 text-[10px]">
              {simulations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'create' 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Simulation
          </button>
        </div>

        {/* Status Filter (Only visible on list tab) */}
        {activeTab === 'list' && simulations.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl"
          >
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Configure New Simulation Pipeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Define environment variables, spectrum band allocations, and sequence parameters.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  Simulation Identifier Name
                </label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  placeholder="e.g., Sector-Alpha-RF"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Number of Bands
                  </label>
                  <input 
                    type="number" 
                    value={bands} 
                    onChange={e => setBands(Number(e.target.value))} 
                    min={1} 
                    max={64} 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                  <p className="text-[10px] text-slate-500">Range: 1 to 64 active channels</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Duration Steps
                  </label>
                  <input 
                    type="number" 
                    value={duration} 
                    onChange={e => setDuration(Number(e.target.value))} 
                    min={100} 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                  <p className="text-[10px] text-slate-500">Minimum 100 ticks</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    Random Seed
                  </label>
                  <input 
                    type="number" 
                    value={seed} 
                    onChange={e => setSeed(Number(e.target.value))} 
                    required 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  />
                  <p className="text-[10px] text-slate-500">For deterministic repeatability</p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3 border-t border-slate-800/80">
                <button 
                  type="submit" 
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Initialize Simulation (POST)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl"
          >
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <List className="w-4 h-4 text-indigo-400" />
                Simulation Registry
              </h3>
              <span className="text-xs text-slate-400 font-mono bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-lg">
                Showing {filteredSimulations.length} of {simulations.length}
              </span>
            </div>

            {filteredSimulations.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <Radio className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-300">No simulations found</p>
                <p className="text-[11px] text-slate-500 mt-1">Try clearing filters or create a new simulation configuration.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">ID</th>
                      <th className="py-3.5 px-5">Name</th>
                      <th className="py-3.5 px-5">Bands</th>
                      <th className="py-3.5 px-5">Duration</th>
                      <th className="py-3.5 px-5">Seed</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {filteredSimulations.map(sim => {
                      const isActive = activeSimulationId === sim.id;
                      return (
                        <tr 
                          key={sim.id} 
                          className={`transition-colors group ${
                            isActive 
                              ? 'bg-indigo-950/30 border-l-2 border-l-indigo-500' 
                              : 'hover:bg-slate-800/20'
                          }`}
                        >
                          <td className="py-4 px-5 font-mono text-slate-400">
                            <span className="bg-slate-950/80 border border-slate-800/80 px-2 py-1 rounded text-[11px]">
                              {sim.id}
                            </span>
                          </td>
                          <td className="py-4 px-5 font-semibold text-white flex items-center gap-2">
                            {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                            {sim.name}
                          </td>
                          <td className="py-4 px-5 text-slate-300 font-mono">{sim.bands}</td>
                          <td className="py-4 px-5 text-slate-300 font-mono">{sim.duration_steps}</td>
                          <td className="py-4 px-5 text-slate-300 font-mono">{sim.seed}</td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              sim.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10' :
                              sim.status === 'draft' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                sim.status === 'running' ? 'bg-emerald-400 animate-pulse' :
                                sim.status === 'draft' ? 'bg-indigo-400' : 'bg-amber-400'
                              }`} />
                              {sim.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                                  isActive 
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-sm' 
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                                onClick={() => setActiveSimulation(isActive ? null : sim.id)}
                              >
                                {isActive ? 'Deactivate' : 'Activate (WS)'}
                              </button>
                              <button
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                                disabled={sim.status === 'running'}
                                onClick={() => handleStart(sim.id)}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Start
                              </button>
                              <button
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                                disabled={sim.status !== 'running'}
                                onClick={() => handleStop(sim.id)}
                              >
                                <Square className="w-3 h-3 fill-current" />
                                Stop
                              </button>
                              <button
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                onClick={() => handleReset(sim.id)}
                              >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                              </button>
                              <button
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20 transition-colors flex items-center gap-1 cursor-pointer"
                                onClick={() => deleteSimulation(sim.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};