import React, { useState, useEffect, useRef, useCallback } from "react";

export type RadarBand = "L-BAND" | "S-BAND" | "X-BAND";

export type TargetType = "aircraft" | "missile" | "uav" | "unknown";

export type RadarTarget = {
  id: string;
  angle: number; // 0 = North (0°), clockwise
  distance: number; // 0-100% of max range
  label: string;
  type: TargetType;
  isHostile: boolean; // True = Red, False = Green
  speedKnots: number;
  altitudeFt: number;
};

type DRDORadarProps = {
  sweepDurationSec?: number; // Time for 360-degree rotation
};

const BAND_DATA: Record<RadarBand, { freq: string; prf: string; power: string; mode: string }> = {
  "L-BAND": { freq: "1.25 GHz", prf: "450 Hz", power: "1.2 MW", mode: "LONG RANGE AIR SURVEILLANCE" },
  "S-BAND": { freq: "3.10 GHz", prf: "800 Hz", power: "850 kW", mode: "4D MULTI-TARGET TRACKING" },
  "X-BAND": { freq: "9.65 GHz", prf: "1400 Hz", power: "450 kW", mode: "AESA PRECISION FIRE CONTROL" },
};

const generateRandomTargets = (): RadarTarget[] => {
  const friendlyNames = ["SU-30MKI", "TEJAS-MK1A", "TAPAS-BH", "NETRA-AEW", "RAFALE-IND"];
  const hostileNames = ["UNK-BOGEY", "M-HYPER", "DRONE-SWARM", "CRUISE-MSL", "INTRUDER-X"];

  const count = Math.floor(Math.random() * 4) + 4;
  const targets: RadarTarget[] = [];

  for (let i = 0; i < count; i++) {
    const isHostile = Math.random() < 0.45;
    const typeList: TargetType[] = isHostile
      ? ["missile", "unknown", "uav"]
      : ["aircraft", "uav"];
    
    const type = typeList[Math.floor(Math.random() * typeList.length)];
    const namePool = isHostile ? hostileNames : friendlyNames;
    const label = namePool[Math.floor(Math.random() * namePool.length)];
    const prefix = isHostile ? "THRT" : "IND";
    const id = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    targets.push({
      id,
      label,
      type,
      isHostile,
      angle: Math.floor(Math.random() * 360),
      distance: Math.floor(Math.random() * 75) + 15,
      speedKnots: isHostile ? Math.floor(Math.random() * 800) + 400 : Math.floor(Math.random() * 450) + 200,
      altitudeFt: Math.floor(Math.random() * 32000) + 3000,
    });
  }

  return targets;
};

export default function DRDORadarSystemLandscape({
  sweepDurationSec = 4,
}: DRDORadarProps) {
  const [selectedBand, setSelectedBand] = useState<RadarBand>("S-BAND");
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const [targets, setTargets] = useState<RadarTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<RadarTarget | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setTargets(generateRandomTargets());
  }, []);

  const handleRescan = useCallback(() => {
    setTargets(generateRandomTargets());
    setSelectedTarget(null);
  }, []);

  useEffect(() => {
    const updateSweep = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = time - lastTimeRef.current;
        const degreesPerMs = 360 / (sweepDurationSec * 1000);
        setSweepAngle((prev) => (prev + degreesPerMs * delta) % 360);
      }
      lastTimeRef.current = time;
      animFrameRef.current = requestAnimationFrame(updateSweep);
    };

    animFrameRef.current = requestAnimationFrame(updateSweep);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [sweepDurationSec]);

  const getTargetPosition = (angleDeg: number, distPercent: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const r = Math.min(Math.max(distPercent, 0), 100) / 2;
    return {
      left: `${50 + Math.sin(rad) * r}%`,
      top: `${50 - Math.cos(rad) * r}%`,
    };
  };

  const getTargetOpacity = (targetAngle: number) => {
    const diff = (sweepAngle - targetAngle + 360) % 360;
    if (diff < 15) return 1.0;
    const decay = Math.max(0, 1 - diff / 220);
    return Math.max(0.2, decay);
  };

  const currentSpecs = BAND_DATA[selectedBand];
  const hostileCount = targets.filter((t) => t.isHostile).length;
  const friendlyCount = targets.length - hostileCount;

  return (
    <div className="w-full max-w-5xl mx-auto select-none rounded-lg border border-zinc-800 bg-[#090b0a] p-5 text-zinc-300 font-mono">
      
      {/* HEADER BAR */}
      <div className="mb-5 flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/20">
            RESTRICTED
          </span>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
              DRDO // LRDE UTTAM AESA RADAR
            </h1>
            <p className="text-[10px] text-zinc-500">
              LAT: 28.6139° N, LON: 77.2090° E
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRescan}
            className="px-3 py-1 text-[11px] font-medium rounded border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition-all active:scale-95"
          >
            ↻ Scan
          </button>

          <div className="flex gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
            {(["L-BAND", "S-BAND", "X-BAND"] as RadarBand[]).map((band) => (
              <button
                key={band}
                onClick={() => setSelectedBand(band)}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                  selectedBand === band
                    ? "bg-zinc-200 text-zinc-950 font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {band}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* RADAR SCOPE VIEWPORT */}
        <div className="lg:col-span-6 flex justify-center relative">
          <div
            className="relative overflow-hidden rounded-full border border-zinc-800 bg-zinc-950"
            style={{
              width: "100%",
              maxWidth: "380px",
              aspectRatio: "1/1",
            }}
          >
            {/* RETICLE GRID */}
            <div className="absolute left-0 top-1/2 h-px w-full bg-zinc-800/60" />
            <div className="absolute left-1/2 top-0 h-full w-px bg-zinc-800/60" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-45 bg-zinc-900" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 -rotate-45 bg-zinc-900" />

            {/* RANGE RINGS */}
            {[0.33, 0.66, 1.0].map((scale, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-800/60 pointer-events-none"
                style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
              />
            ))}

            {/* COMPASS LABELS */}
            <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[9px] text-zinc-500">N</span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500">S</span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500">W</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500">E</span>

            {/* SWEEP CONE */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                transform: `rotate(${sweepAngle - 90}deg)`,
                background: `conic-gradient(from 0deg at 50% 50%, rgba(255, 255, 255, 0.05) 0deg, rgba(255, 255, 255, 0.01) 40deg, transparent 120deg)`,
              }}
            />

            {/* SWEEP LINE */}
            <div
              className="absolute left-1/2 top-1/2 h-[50%] w-[1px] origin-top bg-zinc-400 pointer-events-none"
              style={{ transform: `rotate(${sweepAngle}deg)` }}
            />

            {/* TARGETS */}
            {targets.map((target) => {
              const pos = getTargetPosition(target.angle, target.distance);
              const opacity = getTargetOpacity(target.angle);
              const isSelected = selectedTarget?.id === target.id;
              const colorHex = target.isHostile ? "#f43f5e" : "#10b981";

              return (
                <div
                  key={target.id}
                  onClick={() => setSelectedTarget(target)}
                  className="absolute cursor-pointer transition-opacity group"
                  style={{ left: pos.left, top: pos.top, opacity }}
                >
                  <div
                    className="h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: colorHex }}
                  />

                  <div
                    className={`absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-none transition-all ${
                      isSelected ? "border-zinc-200 scale-125" : "border-transparent"
                    }`}
                  />

                  <span
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[8px] font-medium whitespace-nowrap bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800 text-zinc-300"
                  >
                    {target.id}
                  </span>
                </div>
              );
            })}

            {/* ORIGIN */}
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300" />
          </div>
        </div>

        {/* TELEMETRY & MATRIX PANEL */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
          
          {/* SPECS GRID */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5">
              <span className="text-zinc-500 block">BAND CONFIG</span>
              <span className="font-bold text-zinc-200">{selectedBand}</span>
              <span className="text-[8px] text-zinc-500 block mt-0.5 truncate">{currentSpecs.mode}</span>
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5">
              <span className="text-zinc-500 block">CARRIER / PRF</span>
              <span className="font-bold text-zinc-200">{currentSpecs.freq}</span>
              <span className="text-[8px] text-zinc-500 block mt-0.5">PRF: {currentSpecs.prf}</span>
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5">
              <span className="text-zinc-500 block">CONTACT SUMMARY</span>
              <span className="font-bold text-zinc-200">{targets.length} TRACKED</span>
              <span className="text-[8px] text-zinc-500 block mt-0.5">
                <span className="text-emerald-400">{friendlyCount} FRIEND</span> / <span className="text-rose-400">{hostileCount} THREAT</span>
              </span>
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5">
              <span className="text-zinc-500 block">PEAK POWER</span>
              <span className="font-bold text-zinc-200">{currentSpecs.power}</span>
              <span className="text-[8px] text-zinc-500 block mt-0.5">SWEEP: {sweepDurationSec}s</span>
            </div>
          </div>

          {/* TARGET TABLE */}
          <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5 h-36 overflow-y-auto">
            <div className="text-[10px] font-bold text-zinc-500 border-b border-zinc-800 pb-1 mb-1.5 flex justify-between">
              <span>CONTACT LIST</span>
              <span>STATUS</span>
            </div>

            <div className="space-y-1">
              {targets.map((tgt) => {
                const isSelected = selectedTarget?.id === tgt.id;
                return (
                  <div
                    key={tgt.id}
                    onClick={() => setSelectedTarget(tgt)}
                    className={`flex items-center justify-between text-[10px] p-1.5 rounded cursor-pointer transition-all ${
                      isSelected
                        ? "bg-zinc-800 text-zinc-100"
                        : "hover:bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: tgt.isHostile ? "#f43f5e" : "#10b981" }}
                      />
                      <span className="font-medium">{tgt.id}</span>
                      <span className="text-zinc-600">({tgt.label})</span>
                    </div>

                    <div className="flex items-center gap-2 text-[9px]">
                      <span>{tgt.distance} KM</span>
                      <span className={tgt.isHostile ? "text-rose-400 font-bold" : "text-emerald-400"}>
                        {tgt.isHostile ? "THREAT" : "FRIEND"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TARGET SELECTION DETAIL CARD */}
          <div className="rounded border border-zinc-800 bg-zinc-950 p-2.5 text-[10px] text-zinc-300 min-h-[60px]">
            {selectedTarget ? (
              <div>
                <div className="font-bold text-zinc-200 border-b border-zinc-800 pb-1 mb-1 flex justify-between">
                  <span>SELECTED: [{selectedTarget.id}]</span>
                  <span className={selectedTarget.isHostile ? "text-rose-400" : "text-emerald-400"}>
                    {selectedTarget.isHostile ? "HOSTILE" : "FRIENDLY"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-zinc-400">
                  <div>PLATFORM: {selectedTarget.label}</div>
                  <div>TYPE: {selectedTarget.type.toUpperCase()}</div>
                  <div>BEARING: {selectedTarget.angle}°</div>
                  <div>RANGE: {selectedTarget.distance} KM</div>
                  <div>VELOCITY: {selectedTarget.speedKnots} KTS</div>
                  <div>ALTITUDE: {selectedTarget.altitudeFt} FT</div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-[10px]">
                SELECT A CONTACT FOR TELEMETRY INSPECTION
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}