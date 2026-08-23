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
    <div className="bento-card p-5 space-y-5">
      <div className="flex items-center justify-between -green-500/15 pb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-green-400" />
          <h2 className="font-tactical font-bold text-sm text-white tracking-wider">
            BASELINE vs ML PERFORMANCE METRICS
          </h2>
        </div>
        <div className="px-3 py-1 bento-tile text-green-300 text-xs font-mono font-semibold flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+{pdImprovement}% Detection Improvement</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Pd Card */}
        <div className="bento-tile p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>DETECTION RATE (Pd)</span>
            <Target className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-green-300">{(ml.pd * 100).toFixed(1)}%</span>
            <span className="text-xs text-slate-500 font-mono">Base: {(base.pd * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-1 text-[10px] text-green-400 font-mono">
            ▲ +{pdImprovement}% over round-robin
          </div>
        </div>

        {/* AIT Card */}
        <div className="bento-tile p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>INTERCEPT TIME (AIT)</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-amber-300">{ml.ait} steps</span>
            <span className="text-xs text-slate-500 font-mono">Base: {base.ait}s</span>
          </div>
          <div className="mt-1 text-[10px] text-green-400 font-mono">
            ▼ {aitReduction}% faster intercept
          </div>
        </div>

        {/* Scan Efficiency Card */}
        <div className="bento-tile p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SCAN EFFICIENCY</span>
            <Zap className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-green-300">{(ml.scan_efficiency * 100).toFixed(1)}%</span>
            <span className="text-xs text-slate-500 font-mono">Base: {(base.scan_efficiency * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-mono">
            Useful scans / Total scans
          </div>
        </div>

        {/* Pfa Card */}
        <div className="bento-tile p-3">
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(6,14,9,0.92)', borderColor: 'rgba(74,222,128,0.3)', borderRadius: '18px', fontSize: '12px', backdropFilter: 'blur(12px)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="Baseline" fill="rgba(148,163,184,0.5)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="ML Scheduler" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
