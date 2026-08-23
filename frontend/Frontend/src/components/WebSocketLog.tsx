import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Terminal, Wifi, CheckCircle2 } from 'lucide-react';

export const WebSocketLog: React.FC = () => {
  const { wsConnected, wsLog, simulation } = useSimulationStore();

  return (
    <div className="bento-card p-5 space-y-3">
      <div className="flex items-center justify-between -green-500/15 pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-green-400" />
          <h2 className="font-tactical font-bold text-sm text-white tracking-wider">
            WEBSOCKET STREAM & DECISION LOG
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Wifi className="w-3.5 h-3.5 text-green-400 animate-pulse" />
          <span className="text-green-400 font-bold">CONNECTED</span>
          <span className="text-slate-500">| /ws/v1/simulations/{simulation.id}</span>
        </div>
      </div>

      {/* Decision Log Table */}
      <div className="max-h-48 overflow-y-auto rounded-2xl -white/8 custom-scrollbar font-mono text-[11px]">
        {simulation.history.length === 0 ? (
          <div className="p-4 text-slate-500 text-center">
            No decisions logged yet. Click <strong className="text-green-400">RUN LIVE</strong> or <strong className="text-green-400">STEP</strong> to produce scan events.
          </div>
        ) : (
          <table className="w-full text-left -collapse">
            <thead className="bg-white/[0.03] text-slate-400 sticky top-0 -white/8 backdrop-blur-sm">
              <tr>
                <th className="p-1.5">TIME</th>
                <th className="p-1.5">STEP</th>
                <th className="p-1.5">TUNED BANDS</th>
                <th className="p-1.5">POLICY</th>
                <th className="p-1.5">OUTCOME</th>
                <th className="p-1.5">REWARD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {simulation.history.map((h, i) => (
                <tr key={i} className="hover:bg-green-500/[0.05] transition-colors">
                  <td className="p-1.5 text-slate-500">{h.timestamp}</td>
                  <td className="p-1.5 text-green-400 font-bold">#{h.step}</td>
                  <td className="p-1.5 font-bold text-amber-300">[{h.scanned_bands.join(', ')}]</td>
                  <td className="p-1.5 capitalize text-slate-400">{h.policy_used}</td>
                  <td className="p-1.5">
                    {h.target_band_active ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-300 -green-500/30 font-bold">
                        TRUE DETECTION (TP)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full bg-white/[0.04] text-slate-500 -white/10">
                        QUIET BAND
                      </span>
                    )}
                  </td>
                  <td className={`p-1.5 font-bold ${h.reward > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                    {h.reward > 0 ? `+${h.reward}` : h.reward}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
