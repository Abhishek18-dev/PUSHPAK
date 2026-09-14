import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Activity, Eye, EyeOff, Crosshair, Zap, Info, Radio, BarChart3, Waves, Sparkles } from 'lucide-react';

export const SpectrumGrid: React.FC = () => {
  const { activeSimulation, bandOccupancy, tunedBands, emitters, liveMetrics } = useAppStore();
  const [selectedBand, setSelectedBand] = useState<number | null>(7);
  const [showGroundTruth, setShowGroundTruth] = useState(true);
  const [viewMode, setViewMode] = useState<'analyzer' | 'waterfall'>('analyzer');
  const [waterfallRows, setWaterfallRows] = useState<boolean[][]>([]);

  const numBands = activeSimulation?.bands || 16;
  const bandsList = Array.from({ length: numBands }, (_, i) => i);

  // Map emitters to bands
  const emitterMap: Record<number, any> = {};
  emitters.forEach((e, idx) => {
    const b = e.band ?? idx;
    emitterMap[b] = e;
  });

  // Track simulated live waterfall history
  useEffect(() => {
    const currentRow = bandsList.map(b => Boolean(bandOccupancy[b]));
    setWaterfallRows(prev => [currentRow, ...prev.slice(0, 18)]);
  }, [bandOccupancy, liveMetrics?.step]);

  return (
    <div className="w-full flex flex-col space-y-4 select-none font-sans">
      
      {/* ── TOP CONTROLLER: TITLE & VIEW MODE SELECTOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center border border-green-500/30">
            <Activity className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div>
            <h2 className="font-tactical font-extrabold text-sm text-white tracking-wider">
              LIVE SPECTRUM ANALYZER
            </h2>
            <p className="text-[9px] font-mono text-slate-400">
              2400 MHz — 2720 MHz (16 Channels • 20 MHz IBW)
            </p>
          </div>
        </div>

        {/* View Mode & Ground Truth Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-full text-[10px] font-mono border border-white/5">
            <button
              onClick={() => setViewMode('analyzer')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'analyzer'
                  ? 'bg-green-500/20 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.3)] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3 h-3" /> RF Power
            </button>
            <button
              onClick={() => setViewMode('waterfall')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'waterfall'
                  ? 'bg-green-500/20 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.3)] font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Waves className="w-3 h-3" /> Waterfall
            </button>
          </div>

          <button
            onClick={() => setShowGroundTruth(!showGroundTruth)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono transition-all cursor-pointer border ${
              showGroundTruth
                ? 'bg-green-500/15 text-green-300 border-green-500/40'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/5'
            }`}
          >
            {showGroundTruth ? <Eye className="w-3 h-3 text-green-400" /> : <EyeOff className="w-3 h-3" />}
            <span>TRUTH</span>
          </button>
        </div>
      </div>

      {/* ── MAIN VISUALIZER: RF EQUALIZER BARS OR WATERFALL ── */}
      {viewMode === 'analyzer' ? (
        /* RF Spectrum Power Equalizer Channels */
        <div className="w-full flex flex-col space-y-2">
          
          {/* Equalizer Waveform Bars (16 Channels) */}
          <div className="h-44 w-full flex items-end justify-between gap-1 sm:gap-1.5 px-2 py-3 bg-white/[0.02] rounded-3xl backdrop-blur-md relative overflow-x-auto custom-scrollbar">
            
            {/* Ambient Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 p-2">
              <div className="w-full h-[1px] -green-500/40 -dashed" />
              <div className="w-full h-[1px] -green-500/30 -dashed" />
              <div className="w-full h-[1px] -green-500/20" />
            </div>

            {bandsList.map((bandId) => {
              const isTuned = tunedBands.includes(bandId);
              const isSelected = selectedBand === bandId;
              const isActive = Boolean(bandOccupancy[bandId]);
              const emitter = emitterMap[bandId];
              const emitterType = emitter?.behavior_class ? emitter.behavior_class.replace('behavior_', '').toLowerCase() : null;
              
              // Dynamic energy power height
              const powerPercent = isTuned && isActive 
                ? 95 
                : isActive 
                ? 70 + ((bandId % 3) * 10) 
                : isTuned 
                ? 30 
                : 12 + ((bandId % 4) * 4);

              let barColor = 'bg-white/10';
              let glowColor = '';

              if (isTuned && isActive) {
                barColor = 'bg-gradient-to-t from-green-600 via-green-400 to-emerald-200';
                glowColor = 'shadow-[0_0_20px_rgba(34,197,94,0.6)]';
              } else if (isActive) {
                if (emitterType === 'fixed') {
                  barColor = 'bg-gradient-to-t from-rose-600 to-rose-400';
                  glowColor = 'shadow-[0_0_15px_rgba(244,63,94,0.5)]';
                } else if (emitterType === 'periodic') {
                  barColor = 'bg-gradient-to-t from-amber-600 to-amber-400';
                  glowColor = 'shadow-[0_0_15px_rgba(245,158,11,0.5)]';
                } else if (emitterType === 'agile') {
                  barColor = 'bg-gradient-to-t from-purple-600 to-purple-400';
                  glowColor = 'shadow-[0_0_15px_rgba(168,85,247,0.5)]';
                } else {
                  barColor = 'bg-gradient-to-t from-green-600 to-green-400';
                  glowColor = 'shadow-[0_0_15px_rgba(34,197,94,0.5)]';
                }
              } else if (isTuned) {
                barColor = 'bg-green-400/40';
                glowColor = 'shadow-[0_0_10px_rgba(34,197,94,0.3)]';
              }

              return (
                <div
                  key={bandId}
                  onClick={() => setSelectedBand(bandId)}
                  className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-all ${
                    isSelected ? 'scale-105' : ''
                  }`}
                >
                  {/* Top Tuned Crosshair Pointer */}
                  {isTuned && (
                    <div className="mb-1 text-green-400 animate-bounce">
                      <Crosshair className="w-3.5 h-3.5 drop-shadow-[0_0_6px_#22c55e]" />
                    </div>
                  )}

                  {/* Active Signal Peak Indicator */}
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] mb-1 animate-pulse" />
                  )}

                  {/* Equalizer Vertical Energy Column */}
                  <div
                    className={`w-full max-w-[20px] rounded-full transition-all duration-300 ${barColor} ${glowColor}`}
                    style={{ height: `${powerPercent}%` }}
                  />

                  {/* Frequency Band Tag */}
                  <span className={`text-[8px] font-mono mt-2 transition-colors ${
                    isTuned ? 'text-green-400 font-extrabold scale-110' : isSelected ? 'text-white font-bold' : 'text-slate-500'
                  }`}>
                    {bandId}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Frequency Span Axis */}
          <div className="flex justify-between items-center px-3 text-[9px] font-mono text-slate-400">
            <span>2400 MHz</span>
            <span className="text-green-400/60 font-bold tracking-widest">• CENTER: 2560 MHz •</span>
            <span>2720 MHz</span>
          </div>

        </div>
      ) : (
        /* Continuous Waterfall Spectrogram Stream */
        <div className="w-full flex flex-col space-y-2">
          <div className="h-44 w-full bg-white/[0.02] p-3 rounded-3xl backdrop-blur-md flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pb-1 -white/5">
              <span>TIME: PAST 20 STEPS ↓</span>
              <span className="text-green-400">WATERFALL HISTOGRAM</span>
            </div>

            {/* Waterfall History Rows */}
            <div className="flex-1 flex flex-col justify-between py-1 space-y-0.5">
              {waterfallRows.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-1 h-1.5 items-center">
                  {row.map((active, bIdx) => (
                    <div
                      key={bIdx}
                      className={`flex-1 h-full rounded-full transition-colors ${
                        active 
                          ? 'bg-green-400 shadow-[0_0_6px_#22c55e]' 
                          : tunedBands.includes(bIdx)
                          ? 'bg-green-500/20'
                          : 'bg-white/[0.03]'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom Band Indices */}
            <div className="flex justify-between text-[8px] font-mono text-slate-500 pt-1 -white/5">
              {bandsList.map(b => (
                <span key={b} className={tunedBands.includes(b) ? 'text-green-400 font-bold' : ''}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM FLOATING INSPECTOR APERTURE ── */}
      {selectedBand !== null && (
        <div className="p-3.5 bg-white/[0.03] rounded-2xl text-xs font-mono text-slate-200 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            <span className="font-bold text-white font-tactical text-sm tracking-wider">
              CHANNEL #{selectedBand} TELEMETRY
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-[10px]">
            <div>
              <span className="text-slate-400">FREQ: </span>
              <strong className="text-green-300 font-bold">{2400 + selectedBand * 20} MHz</strong>
            </div>

            <div>
              <span className="text-slate-400">SIGNAL: </span>
              <strong className={bandOccupancy[selectedBand] ? 'text-green-400 font-bold' : 'text-slate-500'}>
                {bandOccupancy[selectedBand] ? 'ACTIVE EMITTING' : 'QUIET IDLE'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400">RECEIVER: </span>
              <strong className={tunedBands.includes(selectedBand) ? 'text-green-400 font-bold' : 'text-slate-500'}>
                {tunedBands.includes(selectedBand) ? 'TUNED (SCANNING)' : 'UNLOCKED'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400">TYPE: </span>
              <strong className="text-amber-300 font-bold uppercase">
                {emitterMap[selectedBand]?.behavior_class?.replace('behavior_', '') || 'NONE'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400">PERIODIC LOCK: </span>
              <strong className="text-green-400 font-bold">
                {selectedBand === 7 ? '88% CONF' : selectedBand === 3 ? '92% CONF' : '0%'}
              </strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
