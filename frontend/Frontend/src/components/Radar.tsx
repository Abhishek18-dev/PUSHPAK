import React, { useState, useEffect } from 'react';
import { Target, Zap, ShieldAlert, Activity, Radio } from 'lucide-react';
import { useAppStore } from '../store';

interface RadarTargetNode {
  id: string;
  angle: number; // 0 to 360 degrees
  distance: number; // 20 to 90%
  band: number;
  freqMhz: number;
  type: 'fixed' | 'periodic' | 'agile' | 'random' | 'intermittent';
  priority: number;
  isActive?: boolean;
  isTuned?: boolean;
}

export default function Radar() {
  const { emitters, bandOccupancy, tunedBands, activeSimulation } = useAppStore();
  const [sweepAngle, setSweepAngle] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState<RadarTargetNode | null>(null);

  // Animate radar sweep 360 degrees continuously
  useEffect(() => {
    const timer = setInterval(() => {
      setSweepAngle((prev) => (prev + 2) % 360);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  const totalBands = activeSimulation?.bands || 16;

  // Build target nodes from real emitters or fallback default targets
  const targets: RadarTargetNode[] = emitters.length > 0
    ? emitters.map((e, idx) => {
        const band = e.band ?? idx;
        const angle = ((band * 360) / totalBands + (idx * 23)) % 360;
        const distance = 30 + ((band % 5) * 12);
        const freqMhz = 2400 + band * 20;
        const typeStr = (e.behavior_class || 'periodic').toLowerCase().replace('behavior_', '') as any;
        const isActive = Boolean(bandOccupancy[band]);
        const isTuned = tunedBands.includes(band);
        return {
          id: `EMIT-${band}`,
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
        { id: 'TRGT-01', angle: 45, distance: 35, band: 3, freqMhz: 2460, type: 'fixed', priority: 3, isActive: Boolean(bandOccupancy[3]), isTuned: tunedBands.includes(3) },
        { id: 'TRGT-02', angle: 120, distance: 65, band: 7, freqMhz: 2540, type: 'periodic', priority: 2, isActive: Boolean(bandOccupancy[7]), isTuned: tunedBands.includes(7) },
        { id: 'TRGT-03', angle: 210, distance: 48, band: 11, freqMhz: 2620, type: 'agile', priority: 3, isActive: Boolean(bandOccupancy[11]), isTuned: tunedBands.includes(11) },
        { id: 'TRGT-04', angle: 290, distance: 75, band: 14, freqMhz: 2680, type: 'periodic', priority: 1, isActive: Boolean(bandOccupancy[14]), isTuned: tunedBands.includes(14) },
        { id: 'TRGT-05', angle: 160, distance: 82, band: 15, freqMhz: 2700, type: 'random', priority: 2, isActive: Boolean(bandOccupancy[15]), isTuned: tunedBands.includes(15) },
      ];

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden font-sans">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.08),transparent_60%)] pointer-events-none" />

      {/* Component-Sized Outer Range Ring Frame */}
      <div className="relative w-full h-full aspect-square max-w-[450px] max-h-[450px] rounded-full border border-[#00E5FF]/20 flex items-center justify-center shadow-[0_0_40px_rgba(0,229,255,0.15)] glow-teal mx-auto">
        
        {/* Concentric Grid Rings */}
        <div className="absolute w-[85%] h-[85%] rounded-full border border-[#00E5FF]/10 border-dashed" />
        <div className="absolute w-[70%] h-[70%] rounded-full border border-[#00E5FF]/15" />
        <div className="absolute w-[55%] h-[55%] rounded-full border border-[#00E5FF]/10 border-dashed" />
        <div className="absolute w-[40%] h-[40%] rounded-full border border-[#00E5FF]/20" />
        <div className="absolute w-[25%] h-[25%] rounded-full border border-[#00E5FF]/15 border-dashed" />

        {/* Crosshair Lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-[#00E5FF]/15" />
          <div className="h-full w-[1px] bg-[#00E5FF]/15 absolute" />
        </div>

        {/* Compass Markers */}
        <span className="absolute top-3 text-[10px] font-mono text-[#00E5FF]/60 font-bold tracking-widest">000°</span>
        <span className="absolute right-3 text-[10px] font-mono text-[#00E5FF]/60 font-bold tracking-widest">090°</span>
        <span className="absolute bottom-3 text-[10px] font-mono text-[#00E5FF]/60 font-bold tracking-widest">180°</span>
        <span className="absolute left-3 text-[10px] font-mono text-[#00E5FF]/60 font-bold tracking-widest">270°</span>

        {/* Rotating Radar Sweep Line & Sector */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ transform: `rotate(${sweepAngle}deg)` }}
        >
          {/* Main Sweep Line */}
          <div className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-gradient-to-t from-transparent via-[#00E5FF] to-[#00ffff] origin-bottom shadow-[0_0_20px_#00E5FF]" />
          {/* Fading Cone Sector */}
          <div
            className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left pointer-events-none"
            style={{
              background: 'conic-gradient(from -60deg at 0% 100%, rgba(0, 229, 255, 0.3) 0deg, rgba(0, 229, 255, 0.05) 30deg, transparent 60deg)'
            }}
          />
        </div>

        {/* Orbiting Signal Connection Lines & Mesh */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#00d2c4]/20" strokeWidth="1">
          <line x1="50%" y1="50%" x2="70%" y2="25%" strokeDasharray="3 3" />
          <line x1="50%" y1="50%" x2="80%" y2="60%" strokeDasharray="3 3" />
          <line x1="50%" y1="50%" x2="30%" y2="70%" strokeDasharray="3 3" />
        </svg>

        {/* Target Nodes */}
        {targets.map((t) => {
          const rad = (t.angle * Math.PI) / 180;
          const radius = (t.distance / 100) * 210;
          const x = Math.sin(rad) * radius;
          const y = -Math.cos(rad) * radius;

          const isNearSweep = Math.abs((sweepAngle - t.angle + 360) % 360) < 30;

          return (
            <div
              key={t.id}
              onClick={() => setSelectedTarget(t)}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className={`absolute cursor-pointer transition-all duration-300 flex flex-col items-center group z-20`}
            >
              {/* Target Dot */}
              <div className={`relative flex items-center justify-center p-1.5 rounded-full border transition-all ${
                t.isActive
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)] scale-110'
                  : t.type === 'fixed'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : t.type === 'agile'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-[#00d2c4]/20 border-[#00d2c4] text-[#00d2c4]'
              } ${isNearSweep ? 'scale-125 glow-teal' : ''} ${t.isTuned ? 'ring-2 ring-[#00E5FF] ring-offset-1 ring-offset-[#060a10]' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${t.isActive ? 'bg-emerald-400 animate-ping' : 'bg-current'}`} />
              </div>

              {/* Target Label Tag */}
              <div className="mt-1 px-1.5 py-0.5 rounded bg-[#09111c]/90 border border-slate-700 text-[9px] font-mono text-slate-200 shadow-lg whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
                {t.id} {t.isActive ? '⚡' : ''} ({t.freqMhz} MHz)
              </div>
            </div>
          );
        })}

        {/* Center Command Core */}
        <div className="w-12 h-12 rounded-full bg-[#081524] border-2 border-[#00d2c4] flex items-center justify-center shadow-lg shadow-cyan-950/60 z-10 glow-teal">
          <Activity className="w-5 h-5 text-[#00d2c4] animate-pulse" />
        </div>
      </div>

      {/* Target Inspector Card Overlay */}
      {selectedTarget && (
        <div className="absolute bottom-3 left-3 right-3 glass-soc-card border border-[#00d2c4]/40 rounded-xl p-3 text-xs font-mono flex items-center justify-between text-slate-200 shadow-2xl z-30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100">{selectedTarget.id} DETECTED</div>
              <p className="text-[10px] text-slate-400">
                Freq: <strong className="text-cyan-300">{selectedTarget.freqMhz} MHz</strong> | Band: <strong className="text-yellow-300">#{selectedTarget.band}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 uppercase font-bold">
              {selectedTarget.type}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
              PRIORITY {selectedTarget.priority}
            </span>
            <button
              onClick={() => setSelectedTarget(null)}
              className="text-slate-500 hover:text-slate-200 px-1 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}