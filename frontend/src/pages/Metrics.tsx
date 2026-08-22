import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { 
  BarChart2, 
  Activity, 
  History, 
  GitCompare, 
  FileCode, 
  Layers, 
  CheckSquare, 
  Square as SquareOutline 
} from 'lucide-react';
import { useAppStore } from '../store';
import { api } from '../services/api';

export const Metrics: React.FC = () => {
  const { activeSimulationId, experiments } = useAppStore();

  // Metrics states
  const [liveMetricsData, setLiveMetricsData] = useState<any>(null);
  const [expId, setExpId] = useState('');
  const [expMetricsData, setExpMetricsData] = useState<any>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareMetricsData, setCompareMetricsData] = useState<any>(null);

  const fetchLiveMetrics = async () => {
    if (!activeSimulationId) {
      toast.error('Activate a simulation first.', {
        description: 'A valid active simulation session is required to fetch live metrics.'
      });
      return;
    }
    const res = await api.metrics.getLive(activeSimulationId);
    if (res.success) {
      setLiveMetricsData(res.data);
      toast.success('Live metrics fetched successfully!', {
        description: `Simulation ID: ${activeSimulationId.slice(-6)}`
      });
    } else {
      toast.error(`Failed to fetch live metrics: ${res.error?.message}`);
    }
  };

  const fetchExperimentMetrics = async () => {
    if (!expId) {
      toast.error('Please enter or select an Experiment ID.', {
        description: 'Choose a target experiment from the dropdown before fetching metrics.'
      });
      return;
    }
    const res = await api.metrics.getExperiment(expId);
    if (res.success) {
      setExpMetricsData(res.data);
      toast.success('Historical metrics loaded!', {
        description: `Experiment ID: ${expId.slice(-6)}`
      });
    } else {
      toast.error(`Failed: ${res.error?.message}`);
    }
  };

  const handleToggleCompareId = (id: string) => {
    setSelectedCompareIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const fetchComparisonMetrics = async () => {
    if (selectedCompareIds.length < 2) {
      toast.error('Select at least 2 experiments to compare.', {
        description: `Currently selected: ${selectedCompareIds.length} experiment(s).`
      });
      return;
    }
    const res = await api.metrics.compare(selectedCompareIds);
    if (res.success) {
      setCompareMetricsData(res.data);
      toast.success('Comparison generated successfully!', {
        description: `Compared ${selectedCompareIds.length} experiments side-by-side.`
      });
    } else {
      toast.error(`Failed comparison: ${res.error?.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-400" />
            Metrics & Evaluation Dumps
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Inspect live simulator telemetry, historical evaluation performance dumps, and multi-experiment comparisons (Level 9).</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Live Metrics */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Live Simulator Metrics
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Fetch metrics for current active simulation.
            </p>
            <button
              onClick={fetchLiveMetrics}
              disabled={!activeSimulationId}
              className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mb-4"
            >
              <Activity className="w-4 h-4" />
              GET /metrics/live
            </button>
            <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Telemetry Payload
            </h4>
            {liveMetricsData ? (
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-64">
                {JSON.stringify(liveMetricsData, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-slate-500 italic py-3">
                No live metrics loaded.
              </p>
            )}
          </div>
        </div>

        {/* Experiment Metrics */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Historical Experiment Metrics
            </h3>
            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Select Experiment ID
              </label>
              <select 
                value={expId} 
                onChange={e => setExpId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Choose Experiment --</option>
                {experiments.map(exp => (
                  <option key={exp.id} value={exp.id}>{exp.id.slice(-6)} ({exp.scenario})</option>
                ))}
              </select>
            </div>
            <button 
              onClick={fetchExperimentMetrics} 
              className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mb-4"
            >
              <History className="w-4 h-4" />
              GET /metrics/&#123;experimentId&#125;
            </button>
            <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Evaluation Report
            </h4>
            {expMetricsData ? (
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-64">
                {JSON.stringify(expMetricsData, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-slate-500 italic py-3">
                Select an experiment and retrieve metrics.
              </p>
            )}
          </div>
        </div>

        {/* Compare Metrics */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-400" />
              Compare Experiments
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Select multiple experiments to compare side-by-side.
            </p>
            
            <div className="max-h-36 overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950/40 p-2 space-y-1.5 mb-4">
              {experiments.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2">No experiments available.</p>
              ) : (
                experiments.map(exp => {
                  const isChecked = selectedCompareIds.includes(exp.id);
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => handleToggleCompareId(exp.id)}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border text-left cursor-pointer ${
                        isChecked 
                          ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                          : 'bg-slate-950/20 border-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      ) : (
                        <SquareOutline className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      <code className="text-[11px] font-mono text-indigo-300">{exp.id.slice(-6)}</code>
                      <span className="text-[11px]">({exp.scenario})</span>
                    </button>
                  );
                })
              )}
            </div>

            <button 
              onClick={fetchComparisonMetrics} 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mb-4"
            >
              <GitCompare className="w-4 h-4" />
              GET /metrics/compare
            </button>
            <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Comparison Payload
            </h4>
            {compareMetricsData ? (
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-64">
                {JSON.stringify(compareMetricsData, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-slate-500 italic py-3">
                Select &ge; 2 experiments and compare.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};