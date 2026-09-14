import React from 'react';
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
    <div className="space-y-6 max-w-7xl mx-auto select-none font-sans pb-10">
      
      {/* ── HEADER TITLE ── */}
      <div className="flex items-center justify-between pb-3 -green-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center -green-500/30">
            <Terminal className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-tactical font-extrabold tracking-wider text-white">
                WEBSOCKET LIVE TELEMETRY HARNESS
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-mono bg-green-500/15 text-green-300 -green-500/30 font-bold">
                STREAM DIAGNOSTICS
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={clearWSLogs}
          className="px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer -white/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
          CLEAR BUFFER
        </button>
      </div>

      {/* ── CONNECTION STATE BAR ── */}
      <div className="p-4 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 flex flex-wrap items-center justify-between gap-4 font-mono text-xs shadow-xl">
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-green-400" />
          <span>ACTIVE SECTOR: <strong className="text-white">{activeSimulationId || 'None'}</strong></span>
        </div>

        <div className="flex items-center gap-2 bg-transparent px-3.5 py-1.5 rounded-full -white/10">
          {wsState === 'CONNECTED' && <Wifi className="w-3.5 h-3.5 text-green-400 animate-pulse" />}
          {wsState === 'CONNECTING' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
          {wsState === 'DISCONNECTED' && <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
          <span className="text-slate-400 text-[10px]">SOCKET STATE:</span>
          <strong className={wsState === 'CONNECTED' ? 'text-green-400' : 'text-rose-400'}>{wsState}</strong>
        </div>
      </div>

      {/* ── LIVE TELEMETRY FRAME STREAM ── */}
      <div className="p-6 rounded-3xl bg-white/[0.02] backdrop-blur-md -green-500/20 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2 -white/5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <h3 className="text-xs font-tactical font-bold text-white uppercase tracking-wider">
              Diagnostic Event Stream Log
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {wsLogs.length} FRAMES RECORDED
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-transparent -white/10 font-mono text-xs text-green-300 max-h-96 overflow-y-auto space-y-1.5 custom-scrollbar">
          {wsLogs.length === 0 ? (
            <p className="text-slate-500 italic py-4 text-center">Awaiting incoming telemetry packets...</p>
          ) : (
            wsLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed hover:bg-white/[0.03] p-1 rounded transition-colors">
                <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                <span>{log}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default WSHarness;