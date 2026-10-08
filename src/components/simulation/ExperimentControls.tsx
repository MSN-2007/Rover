'use client';

import React, { useEffect } from 'react';
import { useSimulationStore, SuctionMode } from '@/store/simulationStore';
import { Play, Pause, RotateCcw, StepForward, RefreshCw, Compass, Navigation, Grid, Target, Layers, ShieldAlert, Sparkles, Cpu, Wind } from 'lucide-react';

const MODES = [
  { id: 'path_planning', label: 'Global Path Planning', icon: Compass },
  { id: 'local_navigation', label: 'Local Navigation', icon: Navigation },
  { id: 'coverage', label: 'Coverage Planning', icon: Grid },
  { id: 'localization', label: 'Localization', icon: Target },
  { id: 'slam', label: 'SLAM / Mapping', icon: Layers },
  { id: 'dynamic_obstacles', label: 'Dynamic Avoidance', icon: ShieldAlert },
  { id: 'dirt_detection', label: 'Dirt Priority Mode', icon: Sparkles },
  { id: 'full_autonomous', label: 'Full Autonomous Agent', icon: Cpu },
] as const;

const ALGORITHMS_BY_MODE: Record<string, { id: string; name: string; shortName: string }[]> = {
  path_planning: [
    { id: 'astar', name: 'A* Search (Optimal Heuristic)', shortName: 'A*' },
    { id: 'dijkstra', name: "Dijkstra's Algorithm (Uniform Cost)", shortName: 'Dijkstra' },
    { id: 'dstarlite', name: 'D* Lite (Incremental Replanning)', shortName: 'D* Lite' },
    { id: 'rrt', name: 'RRT (Rapidly-Exploring Tree)', shortName: 'RRT' },
    { id: 'rrtstar', name: 'RRT* (Asymptotically Optimal)', shortName: 'RRT*' },
  ],
  local_navigation: [
    { id: 'dwa', name: 'Dynamic Window Approach (DWA)', shortName: 'DWA' },
    { id: 'vfh', name: 'Vector Field Histogram (VFH)', shortName: 'VFH' },
  ],
  coverage: [
    { id: 'boustrophedon', name: 'Boustrophedon (Lawnmower)', shortName: 'Boustrophedon' },
    { id: 'stc', name: 'Spanning Tree Coverage (STC)', shortName: 'STC' },
    { id: 'lawnmower', name: 'Grid Parallel Sweep', shortName: 'Sweep' },
  ],
  localization: [
    { id: 'odometry', name: 'Wheel Odometry + IMU', shortName: 'Odometry' },
    { id: 'ekf', name: 'Extended Kalman Filter (EKF)', shortName: 'EKF' },
    { id: 'amcl', name: 'Adaptive Monte Carlo (AMCL)', shortName: 'AMCL' },
  ],
  dynamic_obstacles: [
    { id: 'dwa', name: 'Dynamic Window Approach (DWA)', shortName: 'DWA' },
    { id: 'vfh', name: 'Vector Field Histogram (VFH)', shortName: 'VFH' },
  ],
  full_autonomous: [
    { id: 'astar', name: 'A* Global + DWA Local', shortName: 'A*+DWA' },
    { id: 'dstarlite', name: 'D* Lite + DWA Re-planner', shortName: 'D*+DWA' },
  ],
  slam: [
    { id: 'gmapping', name: 'RBPF Particle Filter (GMapping)', shortName: 'GMapping' },
    { id: 'cartographer', name: 'Graph-based Submap (Cartographer)', shortName: 'Cartographer' },
  ],
  dirt_detection: [
    { id: 'boustrophedon', name: 'Dirt-Weighted Boustrophedon', shortName: 'Dirt-Boust' },
  ],
};

const MAP_PRESETS = [
  { id: 'furniture', label: 'Living Room Flat' },
  { id: 'multi_room', label: 'Multi-Room Apartment' },
  { id: 'corridor', label: 'Narrow Hallways' },
  { id: 'random', label: 'Random Obstacle Layout' },
  { id: 'empty', label: 'Open Ballroom' },
];

export default function ExperimentControls() {
  const {
    mode, setMode, selectedAlgorithms, selectAlgorithm,
    isRunning, isPaused, config, setConfig,
    initSimulation, runSimulation, pauseSimulation, resetSimulation, stepSimulation,
    simTime, suctionMode, setSuctionMode,
  } = useSimulationStore();

  const algorithms = ALGORITHMS_BY_MODE[mode] ?? ALGORITHMS_BY_MODE.path_planning;

  useEffect(() => {
    initSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleRun = () => {
    if (!isRunning) {
      initSimulation();
      setTimeout(() => runSimulation(), 50);
    } else {
      pauseSimulation();
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full text-[#d1d1cd] text-xs">
      {/* Experiment Problem Category */}
      <div>
        <div className="text-[11px] font-medium text-[#8e8e89] mb-2">Problem Category</div>
        <div className="grid grid-cols-1 gap-1">
          {MODES.map(m => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id as Parameters<typeof setMode>[0])}
                className={`text-left px-2.5 py-2 rounded-lg transition-all flex items-center gap-2 border ${
                  active
                    ? 'bg-[#222220] border-[#383834] text-[#f4f4f0] font-medium'
                    : 'bg-transparent border-transparent text-[#8e8e89] hover:bg-[#1a1a18] hover:text-[#d1d1cd]'
                }`}
              >
                <Icon size={14} className={active ? 'text-[#d97757]' : 'text-[#6e6e69]'} />
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Algorithm Selection */}
      <div>
        <div className="text-[11px] font-medium text-[#8e8e89] mb-2">Algorithm</div>
        <div className="flex flex-col gap-1">
          {algorithms.map(alg => {
            const active = selectedAlgorithms.includes(alg.id);
            return (
              <button
                key={alg.id}
                onClick={() => selectAlgorithm(alg.id)}
                className={`text-left px-2.5 py-2 rounded-lg transition-all flex items-center gap-2 border ${
                  active
                    ? 'bg-[#222220] border-[#383834] text-[#f4f4f0] font-medium'
                    : 'bg-transparent border-transparent text-[#8e8e89] hover:bg-[#1a1a18]'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${active ? 'border-[#60a5fa] bg-[#60a5fa]' : 'border-[#4e4e4a]'}`} />
                <span className="truncate">{alg.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Environment Preset */}
      <div>
        <div className="text-[11px] font-medium text-[#8e8e89] mb-2">Environment Room Layout</div>
        <select
          value={config.mapType}
          onChange={e => setConfig({ mapType: e.target.value as Parameters<typeof setConfig>[0]['mapType'] })}
          className="w-full bg-[#1b1b19] border border-[#262624] text-[#f4f4f0] text-xs rounded-lg px-2.5 py-2 outline-none focus:border-[#3e3e3a]"
        >
          {MAP_PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Vacuum Suction Motor Mode */}
      <div>
        <div className="text-[11px] font-medium text-[#8e8e89] mb-2 flex items-center gap-1.5">
          <Wind size={13} className="text-[#60a5fa]" />
          <span>Suction Motor Mode</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-[#1b1b19] p-1 rounded-lg border border-[#262624]">
          {(['eco', 'standard', 'boost'] as SuctionMode[]).map(s => (
            <button
              key={s}
              onClick={() => setSuctionMode(s)}
              className={`py-1 rounded text-center uppercase tracking-wider text-[10px] font-bold transition-all ${
                suctionMode === s
                  ? 'bg-[#262624] text-[#f4f4f0]'
                  : 'text-[#8e8e89] hover:text-[#d1d1cd]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-2.5 pt-2 border-t border-[#262624]">
        <div className="text-[11px] font-medium text-[#8e8e89]">Physics & Dynamics</div>
        <SliderRow label="Speed" value={config.maxLinearVelocity} min={0.2} max={1.8} step={0.1} onChange={v => setConfig({ maxLinearVelocity: v })} unit="m/s" />
        <SliderRow label="Sim Rate" value={config.simulationSpeed} min={0.5} max={4.0} step={0.5} onChange={v => setConfig({ simulationSpeed: v })} unit="x" />
        <SliderRow label="LiDAR Range" value={config.lidarRange} min={2} max={8} step={0.5} onChange={v => setConfig({ lidarRange: v })} unit="m" />
        <SliderRow label="Dyn Obstacles" value={config.dynamicObstacleCount} min={0} max={5} step={1} onChange={v => setConfig({ dynamicObstacleCount: v })} />
        <SliderRow label="Seed" value={config.randomSeed} min={1} max={999} step={1} onChange={v => setConfig({ randomSeed: v })} />
      </div>

      {/* Time & Telemetry Status Card */}
      <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-3 text-center">
        <div className="text-[10px] text-[#8e8e89] uppercase tracking-wider">Simulation Runtime</div>
        <div className="text-xl text-[#f4f4f0] font-mono font-semibold tracking-tight">{simTime.toFixed(1)}s</div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col gap-2 pt-1 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleRun}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              isRunning && !isPaused
                ? 'bg-[#d97757] text-[#ffffff] hover:bg-[#c26547]'
                : 'bg-[#f4f4f0] text-[#141413] hover:bg-[#e4e4df]'
            }`}
          >
            {isRunning && !isPaused ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run</>}
          </button>
          <button
            onClick={stepSimulation}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#1b1b19] hover:bg-[#222220] border border-[#262624] text-[#d1d1cd] transition-all"
          >
            <StepForward size={13} /> Step
          </button>
        </div>

        <button
          onClick={resetSimulation}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#1b1b19] hover:bg-[#222220] border border-[#262624] text-[#8e8e89] hover:text-[#f4f4f0] transition-all"
        >
          <RotateCcw size={13} /> Reset Run
        </button>

        <button
          onClick={initSimulation}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#1b1b19] hover:bg-[#222220] border border-[#262624] text-[#8e8e89] hover:text-[#f4f4f0] transition-all"
        >
          <RefreshCw size={13} /> Regenerate Room
        </button>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[#8e8e89] w-24 flex-shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#f4f4f0]"
      />
      <span className="text-[11px] text-[#f4f4f0] w-12 text-right font-mono">{value}{unit}</span>
    </div>
  );
}
