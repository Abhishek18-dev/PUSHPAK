import React, { useState } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { Activity, Eye, EyeOff, Crosshair, Zap, Info } from 'lucide-react';

export const SpectrumGrid: React.FC = () => {
  const { simulation, selectedBand, setSelectedBand, waterfallHistory } = useSimulationStore();
  const [showGroundTruth, setShowGroundTruth] = useState(true);

  const tunedBands = simulation.receiver.tuned_bands;

  return (
    <div className="bg-[#101622] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold text-slate-100 font-mono tracking-wide">
            REAL-TIME SPECTRUM OCCUPANCY ({simulation.bands} BANDS)
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowGroundTruth(!showGroundTruth)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showGroundTruth
                ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {showGroundTruth ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>GROUND TRUTH OVERLAY</span>
          </button>
        </div>
      </div>

      {/* Spectrum Grid View */}
      <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-2">
        {simulation.spectrum_bands.map((band) => {
          const isTuned = tunedBands.includes(band.band_id);
          const isSelected = selectedBand === band.band_id;

          let statusBg = 'bg-slate-900/60 border-slate-800';
          let textColor = 'text-slate-500';

          if (showGroundTruth && band.is_active) {
            if (band.emitter_type === 'fixed') statusBg = 'bg-rose-950/80 border-rose-600/80 text-rose-300';
            else if (band.emitter_type === 'periodic') statusBg = 'bg-purple-950/80 border-purple-600/80 text-purple-300';
            else if (band.emitter_type === 'agile') statusBg = 'bg-amber-950/80 border-amber-600/80 text-amber-300';
            else statusBg = 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300';
            textColor = 'text-white';
          }

          return (
            <div
              key={band.band_id}
              onClick={() => setSelectedBand(band.band_id)}
              className={`relative cursor-pointer rounded-lg p-2.5 border transition-all flex flex-col items-center justify-between h-24 ${statusBg} ${
                isTuned ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.02] z-10' : ''
              } ${isSelected ? 'border-cyan-300' : ''} hover:border-slate-600`}
            >
              {/* Tuned Marker */}
              {isTuned && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-black px-1.5 py-0.2 text-[9px] font-bold rounded-full flex items-center gap-0.5 shadow-md">
                  <Crosshair className="w-2.5 h-2.5" />
                  TUNED
                </div>
              )}

              <span className="text-[10px] font-mono text-slate-400">#{band.band_id}</span>

              {/* Activity indicator */}
              <div className="my-1 flex flex-col items-center">
                {band.is_active ? (
                  <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                )}
              </div>

              <span className={`text-[10px] font-mono font-semibold ${textColor}`}>
                {band.center_freq_mhz} MHz
              </span>

              {band.emitter_type && (
                <span className="text-[8px] font-mono uppercase opacity-75 truncate max-w-full">
                  {band.emitter_type}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Waterfall History View */}
      <div className="mt-2 border border-slate-800/80 rounded-lg p-3 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            WATERFALL OCCUPANCY (LAST 30 STEPS)
          </span>
          <span>TIME ↓</span>
        </div>

        <div className="space-y-0.5 overflow-hidden max-h-36">
          {waterfallHistory.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-600 font-mono">
              Click RUN LIVE or STEP to start waterfall stream
            </div>
          ) : (
            waterfallHistory.map((row, stepIdx) => (
              <div key={stepIdx} className="flex gap-0.5 h-2">
                {row.map((active, bandIdx) => (
                  <div
                    key={bandIdx}
                    className={`flex-1 rounded-[1px] ${
                      active ? 'bg-cyan-400' : 'bg-slate-900/60'
                    }`}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Band Details Inspector */}
      {selectedBand !== null && (
        <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100">BAND #{selectedBand} INSPECTOR</span>
          </div>
          {(() => {
            const b = simulation.spectrum_bands[selectedBand];
            return (
              <div className="flex flex-wrap gap-4">
                <span>Freq: <strong className="text-cyan-300">{b.center_freq_mhz} MHz</strong></span>
                <span>Active: <strong className={b.is_active ? 'text-emerald-400' : 'text-slate-500'}>{b.is_active ? 'YES' : 'NO'}</strong></span>
                <span>Emitter: <strong className="text-purple-300">{b.emitter_type || 'NONE'}</strong></span>
                <span>Time Since Scan: <strong className="text-yellow-300">{b.time_since_last_scan} steps</strong></span>
                <span>Periodicity Confidence: <strong className="text-cyan-300">{(b.periodicity_confidence * 100).toFixed(0)}%</strong></span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
