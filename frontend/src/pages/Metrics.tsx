import React, { useState } from 'react';
import { toast } from 'sonner';
import { 
  BarChart2, 
  Activity, 
  History, 
  GitCompare, 
  FileCode, 
  Layers, 
  CheckSquare, 
  Square as SquareOutline,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../services/api';

export const Metrics: React.FC = () => {
  const { activeSimulationId, experiments } = useAppStore();

  const [liveMetricsData, setLiveMetricsData] = useState<any>(null);
  const [expId, setExpId] = useState('');
  const [expMetricsData, setExpMetricsData] = useState<any>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareMetricsData, setCompareMetricsData] = useState<any>(null);

  const fetchLiveMetrics = async () => {
    if (!activeSimulationId) {
      toast.error('Activate a simulation sector first.');
      return;
    }
    const res = await api.metrics.getLive(activeSimulationId);
    if (res.success) {
      setLiveMetricsData(res.data);
      toast.success('Live telemetry pulled successfully!');
    } else {
      toast.error(`Failed to fetch live metrics: ${res.error?.message}`);
    }
  };

  const fetchExperimentMetrics = async () => {
    if (!expId) {
      toast.error('Select an Experiment ID.');
      return;
    }
    const res = await api.metrics.getExperiment(expId);
    if (res.success) {
      setExpMetricsData(res.data);
      toast.success('Historical benchmark metrics loaded!');
    } else {
      toast.error(`Failed: ${res.error?.message}`);
    }
  };

  const toggleCompareId = (id: string) => {
    setSelectedCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (selectedCompareIds.length < 2) {
      toast.error('Select at least 2 experiments to compare.');
      return;
    }
    const res = await api.metrics.compare(selectedCompareIds);
    if (res.success) {
      setCompareMetricsData(res.data);
      toast.success('Multi-run comparison generated!');
    } else {
      toast.error(`Compare failed: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none font-sans pb-10">
      
      {/* ── HEADER TITLE ── */}
      <div className="flex items-center justify-between pb-3 -green-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center -green-500/30">
            <BarChart2 className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-tactical font-extrabold tracking-wider text-white">
                METRICS & TELEMETRY ANALYTICS
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono bg-green-500/15 text-green-300 -green-500/30 font-bold">
                AUDIT READY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN METRICS RETRIEVAL DECK ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Live Session Telemetry */}
        <div className="p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 -white/5">
              <Activity className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                Live Simulation Telemetry
              </h3>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mb-3">
              Sector: <strong className="text-white">{activeSimulationId ? activeSimulationId.slice(-6) : 'None'}</strong>
            </p>
            {liveMetricsData && (
              <pre className="p-3 rounded-2xl bg-transparent -white/10 text-[10px] font-mono text-green-300 overflow-x-auto max-h-48 custom-scrollbar">
                {JSON.stringify(liveMetricsData, null, 2)}
              </pre>
            )}
          </div>

          <button
            onClick={fetchLiveMetrics}
            className="w-full py-2.5 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            GET LIVE TELEMETRY
          </button>
        </div>

        {/* 2. Historical Experiment Metrics */}
        <div className="p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 -white/5">
              <History className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                Historical Benchmark Log
              </h3>
            </div>

            <div className="space-y-2 mb-3">
              <select
                value={expId}
                onChange={e => setExpId(e.target.value)}
                className="w-full bg-[#050e08] border border-green-500/30 rounded-2xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-green-400 cursor-pointer"
              >
                <option value="" className="bg-[#040c07] text-slate-400">Select Target Experiment...</option>
                {experiments.map(e => (
                  <option key={e.id} value={e.id} className="bg-[#040c07] text-white">
                    EXP-{e.id.slice(-6)} (Scenario {e.scenario})
                  </option>
                ))}
              </select>
            </div>

            {expMetricsData && (
              <pre className="p-3 rounded-2xl bg-transparent -white/10 text-[10px] font-mono text-green-300 overflow-x-auto max-h-48 custom-scrollbar">
                {JSON.stringify(expMetricsData, null, 2)}
              </pre>
            )}
          </div>

          <button
            onClick={fetchExperimentMetrics}
            className="w-full py-2.5 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <History className="w-4 h-4" />
            FETCH HISTORICAL LOG
          </button>
        </div>

        {/* 3. Multi-Run Comparative Analytics */}
        <div className="p-5 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 -white/5">
              <GitCompare className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
                Multi-Policy Compare
              </h3>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar mb-3">
              {experiments.map(exp => {
                const isSelected = selectedCompareIds.includes(exp.id);
                return (
                  <div
                    key={exp.id}
                    onClick={() => toggleCompareId(exp.id)}
                    className={`p-2 rounded-xl text-[10px] font-mono flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-green-500/20 -green-500/40 text-green-300'
                        : 'bg-white/[0.02] -white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>EXP-{exp.id.slice(-6)} (Scen {exp.scenario})</span>
                    {isSelected && <CheckSquare className="w-3.5 h-3.5 text-green-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleCompare}
            className="w-full py-2.5 rounded-full bg-green-500/20 hover:bg-green-500/30 -green-500/40 text-green-300 text-xs font-tactical font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <GitCompare className="w-4 h-4" />
            COMPARE SELECTED
          </button>
        </div>

      </div>

      {/* Comparison Drawer */}
      {compareMetricsData && (
        <div className="p-6 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/25 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 -white/10">
            <h3 className="text-sm font-tactical font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Comparative Policy Metrics Matrix
            </h3>
            <button onClick={() => setCompareMetricsData(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <pre className="p-4 rounded-2xl bg-transparent -white/10 text-[11px] font-mono text-green-300 overflow-x-auto max-h-64 custom-scrollbar">
            {JSON.stringify(compareMetricsData, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
};

export default Metrics;