import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3, TrendingUp, Zap, Target, Clock, AlertTriangle } from 'lucide-react';

export const MetricsDashboard: React.FC = () => {
  const { simulation } = useSimulationStore();
  const base = simulation.metrics_baseline;
  const ml = simulation.metrics_ml;

  const comparisonData = [
    { metric: 'Detection (Pd)', Baseline: Number((base.pd * 100).toFixed(1)), 'ML Scheduler': Number((ml.pd * 100).toFixed(1)) },
    { metric: 'False Alarm (Pfa)', Baseline: Number((base.pfa * 100).toFixed(1)), 'ML Scheduler': Number((ml.pfa * 100).toFixed(1)) },
    { metric: 'Scan Efficiency', Baseline: Number((base.scan_efficiency * 100).toFixed(1)), 'ML Scheduler': Number((ml.scan_efficiency * 100).toFixed(1)) },
  ];

  const pdImprovement = (((ml.pd - base.pd) / Math.max(0.01, base.pd)) * 100).toFixed(0);
  const aitReduction = (((base.ait - ml.ait) / Math.max(0.1, base.ait)) * 100).toFixed(0);

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold text-slate-100 font-mono tracking-wide">
            BASELINE vs ML PERFORMANCE METRICS
          </h2>
        </div>
        <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-700/80 rounded-full text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+{pdImprovement}% Detection Improvement</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Pd Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>DETECTION RATE (Pd)</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-cyan-300">{(ml.pd * 100).toFixed(1)}%</span>
            <span className="text-xs text-slate-500 font-mono">Base: {(base.pd * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400 font-mono">
            ▲ +{pdImprovement}% over round-robin
          </div>
        </div>

        {/* AIT Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>INTERCEPT TIME (AIT)</span>
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-yellow-300">{ml.ait} steps</span>
            <span className="text-xs text-slate-500 font-mono">Base: {base.ait}s</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400 font-mono">
            ▼ {aitReduction}% faster intercept
          </div>
        </div>

        {/* Scan Efficiency Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SCAN EFFICIENCY</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-emerald-300">{(ml.scan_efficiency * 100).toFixed(1)}%</span>
            <span className="text-xs text-slate-500 font-mono">Base: {(base.scan_efficiency * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            Useful scans / Total scans
          </div>
        </div>

        {/* Pfa Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>FALSE ALARM (Pfa)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-rose-300">{(ml.pfa * 100).toFixed(1)}%</span>
            <span className="text-xs text-slate-500 font-mono">Base: {(base.pfa * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            Low false alarm probability
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="Baseline" fill="#475569" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ML Scheduler" fill="#00f0ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
