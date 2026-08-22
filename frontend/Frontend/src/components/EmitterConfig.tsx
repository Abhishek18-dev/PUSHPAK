import React, { useState } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Radio, Plus, Trash2, Shield } from 'lucide-react';
import { BehaviorClass } from '../types/rf';

export const EmitterConfig: React.FC = () => {
  const { simulation, addEmitter } = useSimulationStore();
  const [behavior, setBehavior] = useState<BehaviorClass>('periodic');
  const [band, setBand] = useState<number>(5);
  const [priority, setPriority] = useState<number>(2);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addEmitter(behavior, band, priority);
  };

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Radio className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-slate-100 font-mono tracking-wide">
            EMITTER POPULATION ({simulation.emitters.length} EMITTERS)
          </h2>
        </div>
      </div>

      {/* Add Emitter Form */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs font-mono">
        <div>
          <label className="text-slate-400 block mb-1">Behavior Class</label>
          <select
            value={behavior}
            onChange={(e) => setBehavior(e.target.value as BehaviorClass)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
          >
            <option value="fixed">Fixed Frequency</option>
            <option value="periodic">Periodic Bursts</option>
            <option value="agile">Frequency Agile</option>
            <option value="random">Pseudo-Random</option>
            <option value="intermittent">Intermittent</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Target Band</label>
          <input
            type="number"
            min="0"
            max={simulation.bands - 1}
            value={band}
            onChange={(e) => setBand(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Priority (1-3)</label>
          <input
            type="number"
            min="1"
            max="3"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 px-3 rounded flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD EMITTER</span>
          </button>
        </div>
      </form>

      {/* Emitter Table */}
      <div className="overflow-x-auto max-h-44 border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">BEHAVIOR</th>
              <th className="p-2">BAND</th>
              <th className="p-2">PRIORITY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-slate-300">
            {simulation.emitters.map((em) => (
              <tr key={em.id} className="hover:bg-slate-900/40">
                <td className="p-2 font-bold text-slate-400">{em.id}</td>
                <td className="p-2 capitalize text-purple-300">{em.behavior_class}</td>
                <td className="p-2 text-cyan-300">Band #{em.band}</td>
                <td className="p-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                    P{em.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
