import React from 'react';
import { motion } from 'motion/react';
import { 
  Radio, 
  Activity, 
  Wifi, 
  WifiOff, 
  Loader2, 
  Trash2, 
  Terminal, 
  Layers 
} from 'lucide-react';
import { useAppStore } from '../store';

export const WSHarness: React.FC = () => {
  const {
    activeSimulationId,
    wsState,
    wsLogs,
    clearWSLogs,
    bandOccupancy,
    tunedBands,
    activeSimulation,
    emitters,
  } = useAppStore();

  const numBands = activeSimulation?.bands || 16;
  const bandsArray = Array.from({ length: numBands }, (_, i) => i);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-400" />
            WebSocket Event Harness & Live Stream
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Inspect real-time spectrum telemetry, receiver tuning overlays, and live frame logs (Level 6).</p>
        </div>
      </div>

      {/* Connection State Info Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Active Simulation ID</span>
            <code className="text-sm font-mono text-indigo-300">{activeSimulationId || 'None'}</code>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            {wsState === 'CONNECTED' && <Wifi className="w-4 h-4 text-emerald-400" />}
            {wsState === 'CONNECTING' && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
            {wsState === 'DISCONNECTED' && <WifiOff className="w-4 h-4 text-rose-400" />}
            <span className="text-xs font-semibold text-slate-300">Status:</span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            wsState === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            wsState === 'CONNECTING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {wsState}
          </span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Spectrum Visualization */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Live Spectrum Grid
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Grid displays activity state of each frequency band. Highlights show currently tuned receiver bands.
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 mb-6">
              {bandsArray.map(bandId => {
                const isActive = bandOccupancy[bandId] || false;
                const isTuned = tunedBands.includes(bandId);
                const emitter = emitters.find(e => e.band === bandId);
                const behaviorLabel = emitter?.behavior_class ? emitter.behavior_class.replace('BEHAVIOR_', '') : 'ACTIVE';

                return (
                  <div
                    key={bandId}
                    className={`relative rounded-xl p-3 text-center transition-all border flex flex-col items-center justify-center ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-slate-950/60 border-slate-800/80'
                    } ${isTuned ? 'ring-1 ring-indigo-500' : ''}`}
                  >
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                      B{bandId}
                    </span>
                    <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isActive ? behaviorLabel : 'QUIET'}
                    </span>
                    {isTuned && (
                      <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                        T
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30 inline-block"></span>
                <span>Emitter Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-600/30 border border-indigo-500 inline-block"></span>
                <span>Receiver Tuned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live WS Logs */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between space-y-6">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Raw WebSocket Frames Log
              </h3>
              <button 
                onClick={clearWSLogs}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Clear Log
              </button>
            </div>

            <div className="flex-1 min-h-[260px] max-h-[300px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 font-mono text-[11px] text-indigo-300">
              {wsLogs.length === 0 ? (
                <div className="text-slate-500 italic h-full flex items-center justify-center text-center py-12">
                  No WebSocket frames received yet. Connect simulator to begin.
                </div>
              ) : (
                wsLogs.map((log, idx) => (
                  <div key={idx} className="pb-2 border-b border-slate-900/80 whitespace-pre-wrap break-all leading-relaxed">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};