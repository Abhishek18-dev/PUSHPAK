import React, { useState, useEffect } from 'react';
import { Target, Zap, Radio, Crosshair, Shield, Activity } from 'lucide-react';
import { useAppStore } from '../store';

interface RadarTargetNode {
  id: string;
  angle: number;
  distance: number;
  band: number;
  freqMhz: number;
  type: 'fixed' | 'periodic' | 'agile' | 'random' | 'intermittent';
  priority: number;
  isActive?: boolean;
  isTuned?: boolean;
}

interface RadarProps {
  size?: 'normal' | 'large' | 'fullscreen';
}

export default function Radar({ size = 'large' }: RadarProps) {
  const { emitters, bandOccupancy, tunedBands, activeSimulation } = useAppStore();
  const [sweepAngle, setSweepAngle] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState<RadarTargetNode | null>(null);

  // Animate radar sweep 360 degrees
  useEffect(() => {
    const timer = setInterval(() => {
      setSweepAngle((prev) => (prev + 2.2) % 360);
    }, 25);
    return () => clearInterval(timer);
  }, []);

  const totalBands = activeSimulation?.bands || 16;

  // Build target nodes from real emitters or fallback default targets
  const targets: RadarTargetNode[] = emitters.length > 0
    ? emitters.map((e, idx) => {
        const band = e.band ?? idx;
        const angle = ((band * 360) / totalBands + (idx * 23)) % 360;
        const distance = 25 + ((band % 6) * 11);
        const freqMhz = 2400 + band * 20;
        const typeStr = (e.behavior_class || 'periodic').toLowerCase().replace('behavior_', '') as any;
        const isActive = Boolean(bandOccupancy[band]);
        const isTuned = tunedBands.includes(band);
        const uniqueId = e.id ? `EMIT-${e.id.slice(-4).toUpperCase()}` : `EMIT-${band < 10 ? '0' + band : band}-${idx + 1}`;
        return {
          id: uniqueId,
          angle,
          distance,
          band,
          freqMhz,
          type: typeStr,
          priority: e.priority || 2,
          isActive,
          isTuned,
        };
      })
    : [
        { id: 'EMIT-03', angle: 45, distance: 35, band: 3, freqMhz: 2460, type: 'fixed', priority: 3, isActive: Boolean(bandOccupancy[3]), isTuned: tunedBands.includes(3) },
        { id: 'EMIT-07', angle: 120, distance: 68, band: 7, freqMhz: 2540, type: 'periodic', priority: 2, isActive: Boolean(bandOccupancy[7]), isTuned: tunedBands.includes(7) },
        { id: 'EMIT-11', angle: 215, distance: 50, band: 11, freqMhz: 2620, type: 'agile', priority: 3, isActive: Boolean(bandOccupancy[11]), isTuned: tunedBands.includes(11) },
        { id: 'EMIT-14', angle: 295, distance: 78, band: 14, freqMhz: 2680, type: 'periodic', priority: 1, isActive: Boolean(bandOccupancy[14]), isTuned: tunedBands.includes(14) },
      ];

  const activeCount = targets.filter(t => t.isActive).length;

  return (
    <div className="w-full flex flex-col items-center justify-between select-none overflow-hidden font-sans p-1">
      
      {/* Floating 360° Circular Radar Plane */}
      <div className="relative w-full aspect-square max-w-[310px] max-h-[310px] sm:max-w-[340px] sm:max-h-[340px] rounded-full -green-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.18)] mx-auto">
        
        {/* Phosphor Glow Radial Sector */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.14),transparent_70%)] pointer-events-none" />

        {/* Concentric Range Rings */}
        <div className="absolute w-[82%] h-[82%] rounded-full -green-500/15 -dashed" />
        <div className="absolute w-[64%] h-[64%] rounded-full -green-500/20" />
        <div className="absolute w-[46%] h-[46%] rounded-full -green-500/15 -dashed" />
        <div className="absolute w-[28%] h-[28%] rounded-full -green-500/25" />
        <div className="absolute w-[12%] h-[12%] rounded-full -green-500/30" />

        {/* Crosshair Lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-green-500/20" />
          <div className="h-full w-[1px] bg-green-500/20 absolute" />
          <div className="w-full h-[1px] bg-green-500/10 rotate-45 transform" />
          <div className="w-full h-[1px] bg-green-500/10 -rotate-45 transform" />
        </div>

        {/* Compass Cardinal Points */}
        <span className="absolute top-2 text-[9px] font-mono text-green-400 font-bold">000° N</span>
        <span className="absolute right-2 text-[9px] font-mono text-green-400 font-bold">090° E</span>
        <span className="absolute bottom-2 text-[9px] font-mono text-green-400 font-bold">180° S</span>
        <span className="absolute left-2 text-[9px] font-mono text-green-400 font-bold">270° W</span>

        {/* Rotating Radar Sweep Line */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ transform: `rotate(${sweepAngle}deg)` }}
        >
          <div className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-gradient-to-t from-transparent via-green-400 to-green-200 origin-bottom shadow-[0_0_15px_#22c55e]" />
          <div
            className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left pointer-events-none"
            style={{
              background: 'conic-gradient(from -60deg at 0% 100%, rgba(34, 197, 94, 0.35) 0deg, rgba(34, 197, 94, 0.05) 35deg, transparent 60deg)'
            }}
          />
        </div>

        {/* Center Receiver Beacon */}
        <div className="absolute w-3.5 h-3.5 rounded-full bg-green-400 shadow-[0_0_12px_#22c55e] z-10 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
        </div>

        {/* Target Blips on Radar Plane */}
        {targets.map((t, idx) => {
          const rad = (t.angle - 90) * (Math.PI / 180);
          const x = 50 + (t.distance / 2) * Math.cos(rad);
          const y = 50 + (t.distance / 2) * Math.sin(rad);

          return (
            <div
              key={`${t.id}-${t.band}-${idx}`}
              onClick={() => setSelectedTarget(t)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {/* Ping Ring for Active Target */}
              {t.isActive && (
                <div className="absolute -inset-2 rounded-full -2 -amber-400/90 animate-ping pointer-events-none" />
              )}

              {/* Target Dot */}
              <div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  t.isTuned
                    ? 'bg-green-400 ring-4 ring-green-500/50 shadow-[0_0_16px_#22c55e] scale-125'
                    : t.isActive
                    ? 'bg-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.9)] animate-pulse'
                    : 'bg-slate-500/80 hover:bg-slate-300'
                }`}
              />

              {/* Label Pin */}
              <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 bg-transparent backdrop-blur-sm -green-500/40 px-1.5 py-0.2 rounded-md text-[8px] font-mono text-green-300 whitespace-nowrap shadow-xl z-30 pointer-events-none">
                {t.id}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Telemetry Bar */}
      <div className="w-full flex items-center justify-between gap-1.5 pt-3 mt-2 text-[10px] font-mono">
        <span className="px-3 py-1 rounded-full bg-green-500/15 text-green-300 -green-500/30 flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-green-400" />
          SWEEP: <strong>360° LIVE</strong>
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 -amber-500/30">
          ACTIVE: <strong>{activeCount}/{targets.length}</strong>
        </span>
        <span className="px-3 py-1 rounded-full bg-white/[0.03] text-slate-300">
          TUNED: <strong className="text-green-400">BAND #{tunedBands[0] ?? 7}</strong>
        </span>
      </div>

      {/* Target Inspector Details if Selected */}
      {selectedTarget && (
        <div className="w-full mt-2 p-2.5 rounded-2xl bg-white/[0.04] text-[10px] font-mono text-slate-200 flex items-center justify-between shadow-xl backdrop-blur-sm -green-500/30">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-green-400" />
            <strong className="text-white text-xs">{selectedTarget.id}</strong>
            <span className="text-green-400">Band #{selectedTarget.band}</span>
            <span className="text-slate-400">({selectedTarget.freqMhz} MHz)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-300 uppercase px-2 py-0.5 rounded-full bg-amber-500/20 -amber-500/30">
              {selectedTarget.type}
            </span>
            <button onClick={() => setSelectedTarget(null)} className="text-slate-400 hover:text-white ml-1 cursor-pointer">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}