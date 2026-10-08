'use client';

import React from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { Eye, EyeOff, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const TOGGLES = [
  { key: 'showPlannedPath', label: 'Planned Path Trajectory', color: '#38bdf8' },
  { key: 'showActualPath', label: 'Odometry Robot Track', color: '#10b981' },
  { key: 'showSensorRays', label: '360° LiDAR Beams', color: '#38bdf8' },
  { key: 'showDirtMap', label: 'Dirt & Dust Regions', color: '#f59e0b' },
  { key: 'showCoverage', label: 'Cleaned Floor Swath', color: '#10b981' },
  { key: 'showCandidateTrajectories', label: 'DWA Motion Candidates', color: '#60a5fa' },
  { key: 'showOpenSet', label: 'A* Open Set Frontier', color: '#f59e0b' },
  { key: 'showClosedSet', label: 'A* Closed Explored Set', color: '#818cf8' },
  { key: 'showDynamicPredictions', label: 'Dynamic Velocity Vectors', color: '#f59e0b' },
  { key: 'showOccupancyGrid', label: 'Discrete Costmap Grid', color: '#64748b' },
] as const;

export default function VisualizationToggles() {
  const { vizState, setVizState } = useSimulationStore();

  return (
    <div className="flex flex-col gap-3.5 h-full overflow-y-auto text-slate-300 font-mono text-xs pr-1">
      <div className="flex items-center gap-1.5 pb-2 border-b border-[#1e2434] text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
        <Layers size={13} className="text-blue-400" />
        <span>Canvas Display Layers</span>
      </div>

      <div className="space-y-1">
        {TOGGLES.map(({ key, label, color }) => {
          const enabled = vizState[key as keyof typeof vizState] as boolean;
          return (
            <button
              key={key}
              onClick={() => setVizState({ [key]: !enabled })}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-all border ${
                enabled
                  ? 'bg-[#141926] border-slate-700 text-slate-200'
                  : 'bg-[#10131d]/60 border-[#1a1f2e] text-slate-500 hover:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: enabled ? color : '#334155' }}
                />
                <span className="truncate">{label}</span>
              </div>
              {enabled ? (
                <Eye size={13} className="text-blue-400 flex-shrink-0 ml-1" />
              ) : (
                <EyeOff size={13} className="text-slate-600 flex-shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Camera Viewport Controls */}
      <div className="bg-[#121622] border border-[#1e2434] rounded-lg p-3 space-y-2 mt-auto">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Camera Control</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVizState({ cameraZoom: Math.max(0.3, vizState.cameraZoom - 0.2) })}
            className="flex-1 py-1.5 bg-[#1a202e] border border-slate-700 rounded text-slate-300 hover:bg-slate-700 flex items-center justify-center gap-1"
          >
            <ZoomOut size={12} /> -
          </button>
          <span className="w-14 text-center font-bold text-blue-400">{vizState.cameraZoom.toFixed(1)}x</span>
          <button
            onClick={() => setVizState({ cameraZoom: Math.min(4.5, vizState.cameraZoom + 0.2) })}
            className="flex-1 py-1.5 bg-[#1a202e] border border-slate-700 rounded text-slate-300 hover:bg-slate-700 flex items-center justify-center gap-1"
          >
            <ZoomIn size={12} /> +
          </button>
        </div>
        <button
          onClick={() => setVizState({ cameraX: 0, cameraY: 0, cameraZoom: 1 })}
          className="w-full py-1.5 bg-[#161c28] border border-[#222938] rounded text-slate-400 hover:text-slate-200 hover:bg-[#1a202e] transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={12} /> Center Camera
        </button>
      </div>
    </div>
  );
}
