import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Terminal, Wifi, CheckCircle2 } from 'lucide-react';

export const WebSocketLog: React.FC = () => {
  const { wsConnected, wsLog, simulation } = useSimulationStore();

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-slate-100 font-mono tracking-wide">
            WEBSOCKET STREAM & DECISION LOG
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-bold">CONNECTED</span>
          <span className="text-slate-500">| /ws/v1/simulations/{simulation.id}</span>
        </div>
      </div>

      {/* Decision Log Table */}
      <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg bg-slate-950 font-mono text-[11px]">
        {simulation.history.length === 0 ? (
          <div className="p-4 text-slate-600 text-center">
            No decisions logged yet. Click <strong>RUN LIVE</strong> or <strong>STEP</strong> to produce scan events.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-1.5">TIME</th>
                <th className="p-1.5">STEP</th>
                <th className="p-1.5">TUNED BANDS</th>
                <th className="p-1.5">POLICY</th>
                <th className="p-1.5">OUTCOME</th>
                <th className="p-1.5">REWARD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {simulation.history.map((h, i) => (
                <tr key={i} className="hover:bg-slate-900/50">
                  <td className="p-1.5 text-slate-500">{h.timestamp}</td>
                  <td className="p-1.5 text-cyan-400 font-bold">#{h.step}</td>
                  <td className="p-1.5 font-bold text-yellow-300">[{h.scanned_bands.join(', ')}]</td>
                  <td className="p-1.5 capitalize text-slate-400">{h.policy_used}</td>
                  <td className="p-1.5">
                    {h.target_band_active ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                        TRUE DETECTION (TP)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-500">
                        QUIET BAND
                      </span>
                    )}
                  </td>
                  <td className={`p-1.5 font-bold ${h.reward > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
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
