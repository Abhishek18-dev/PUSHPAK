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
    <div className="bento-card p-5 space-y-4">
      <div className="flex items-center justify-between -green-500/15 pb-3">
        <div className="flex items-center space-x-2">
          <Radio className="w-5 h-5 text-green-400" />
          <h2 className="font-tactical font-bold text-sm text-white tracking-wider">
            EMITTER POPULATION ({simulation.emitters.length} EMITTERS)
          </h2>
        </div>
      </div>

      {/* Add Emitter Form */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bento-tile p-3 text-xs font-mono">
        <div>
          <label className="text-slate-400 block mb-1">Behavior Class</label>
          <select
            value={behavior}
            onChange={(e) => setBehavior(e.target.value as BehaviorClass)}
            className="w-full bg-[#050e08] border border-green-500/30 rounded-xl px-2 py-1.5 text-white focus:border-green-400 focus:outline-none cursor-pointer"
          >
            <option value="fixed" className="bg-[#040c07] text-white">Fixed Frequency</option>
            <option value="periodic" className="bg-[#040c07] text-white">Periodic Bursts</option>
            <option value="agile" className="bg-[#040c07] text-white">Frequency Agile</option>
            <option value="random" className="bg-[#040c07] text-white">Pseudo-Random</option>
            <option value="intermittent" className="bg-[#040c07] text-white">Intermittent</option>
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
            className="w-full bg-transparent -white/10 rounded-xl px-2 py-1.5 text-slate-200 focus:-green-500/40 focus:outline-none"
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
            className="w-full bg-transparent -white/10 rounded-xl px-2 py-1.5 text-slate-200 focus:-green-500/40 focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full tactical-btn-extruded tactical-btn-green py-1.5 px-3 text-xs font-bold flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD EMITTER</span>
          </button>
        </div>
      </form>

      {/* Emitter Table */}
      <div className="overflow-x-auto max-h-44 rounded-2xl -white/8">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-white/[0.03] text-slate-400 -white/8 sticky top-0 backdrop-blur-sm">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">BEHAVIOR</th>
              <th className="p-2">BAND</th>
              <th className="p-2">PRIORITY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {simulation.emitters.map((em) => (
              <tr key={em.id} className="hover:bg-green-500/[0.05] transition-colors">
                <td className="p-2 font-bold text-slate-400">{em.id}</td>
                <td className="p-2 capitalize text-green-300">{em.behavior_class}</td>
                <td className="p-2 text-green-400">Band #{em.band}</td>
                <td className="p-2">
                  <span className="px-1.5 py-0.5 rounded-full bg-white/[0.04] -white/10 text-amber-300">
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
