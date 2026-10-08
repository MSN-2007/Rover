'use client';

import React from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { Activity, Battery, Sparkles, Navigation2 } from 'lucide-react';

export default function MetricsPanel() {
  const { metrics, simTime, robotState, selectedAlgorithms, batteryLevel, dirtCollectedGrams, dirtTotalGrams, suctionMode, openSet, closedSet } = useSimulationStore();

  const algId = selectedAlgorithms[0] ?? 'astar';
  const dirtPercent = dirtTotalGrams > 0 ? Math.min(100, (dirtCollectedGrams / dirtTotalGrams) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto text-[#d1d1cd] text-xs pr-1">
      {/* Active Alg Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262624]">
        <div className="flex items-center gap-1.5 text-[#8e8e89] text-[11px] uppercase tracking-wider font-medium">
          <Activity size={13} className="text-[#60a5fa]" />
          <span>Rover Telemetry</span>
        </div>
        <span className="text-[10px] font-bold text-[#f4f4f0] bg-[#242422] border border-[#2e2e2a] px-2 py-0.5 rounded uppercase">
          {algId}
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Sim Time" value={`${simTime.toFixed(1)}s`} accent="blue" />
        <MetricCard label="Path Length" value={`${metrics.pathLength.toFixed(2)}m`} accent="sage" />
        <MetricCard label="Planning Time" value={`${metrics.planningTime.toFixed(1)}ms`} accent="coral" />
        <MetricCard label="Nodes Explored" value={metrics.nodesExplored.toLocaleString()} accent="cream" />
        <MetricCard label="Collisions" value={metrics.collisions.toString()} accent={metrics.collisions > 0 ? 'coral' : 'sage'} />
        <MetricCard label="Goal Distance" value={`${metrics.goalDistance.toFixed(2)}m`} accent="blue" />
      </div>

      {/* Dust Cleaning Performance */}
      <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#8e8e89] text-[11px] font-medium">
            <Sparkles size={12} className="text-[#d97757]" />
            <span>Dust Collected</span>
          </div>
          <span className="text-[#d97757] font-semibold text-xs">{dirtPercent.toFixed(1)}%</span>
        </div>

        <div className="w-full bg-[#242422] h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#d97757] rounded-full transition-all duration-300"
            style={{ width: `${dirtPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#8e8e89]">
          <span>Picked: <strong className="text-[#f4f4f0]">{dirtCollectedGrams.toFixed(1)}g</strong></span>
          <span>Total: <strong className="text-[#f4f4f0]">{dirtTotalGrams.toFixed(0)}g</strong></span>
        </div>
      </div>

      {/* Room Area Coverage */}
      <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[#8e8e89] text-[11px] font-medium">Floor Coverage</span>
          <span className="text-[#a7c4bc] font-semibold text-xs">{metrics.coveragePercentage.toFixed(1)}%</span>
        </div>

        <div className="w-full bg-[#242422] h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#a7c4bc] rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, metrics.coveragePercentage)}%` }}
          />
        </div>
      </div>

      {/* Battery Reserve */}
      <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#8e8e89] text-[11px] font-medium">
            <Battery size={13} className={batteryLevel > 30 ? 'text-[#a7c4bc]' : 'text-[#d97757]'} />
            <span>Rover Battery</span>
          </div>
          <span className={`font-semibold text-xs ${batteryLevel > 30 ? 'text-[#a7c4bc]' : 'text-[#d97757]'}`}>
            {batteryLevel.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-[#242422] h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${batteryLevel > 30 ? 'bg-[#a7c4bc]' : 'bg-[#d97757]'}`}
            style={{ width: `${Math.max(0, batteryLevel)}%` }}
          />
        </div>

        <div className="text-[11px] text-[#8e8e89] flex items-center justify-between">
          <span>Suction: <strong className="text-[#f4f4f0] uppercase">{suctionMode}</strong></span>
          <span>14.4V Li-ion</span>
        </div>
      </div>

      {/* Kinematics Telemetry */}
      {robotState && (
        <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-3 space-y-1.5">
          <div className="text-[11px] font-medium text-[#8e8e89] mb-1">Rover Pose & Velocity</div>
          <StateRow label="Position X" value={robotState.pose.x.toFixed(3)} unit="m" />
          <StateRow label="Position Y" value={robotState.pose.y.toFixed(3)} unit="m" />
          <StateRow label="Heading Angle θ" value={((robotState.pose.theta * 180 / Math.PI + 360) % 360).toFixed(1)} unit="°" />
          <StateRow label="Linear Speed v" value={robotState.linearVelocity.toFixed(3)} unit="m/s" />
          <StateRow label="Angular Speed ω" value={robotState.angularVelocity.toFixed(3)} unit="rad/s" />
          <StateRow label="Status" value={robotState.status.replace('_', ' ').toUpperCase()} />
        </div>
      )}

      {/* Search Nodes */}
      <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-3 space-y-1.5">
        <div className="text-[11px] font-medium text-[#8e8e89] mb-1">Search Graph Space</div>
        <StateRow label="Open Frontier" value={openSet.length.toString()} unit="nodes" />
        <StateRow label="Closed Explored" value={closedSet.length.toString()} unit="nodes" />
        <StateRow label="Path Waypoints" value={metrics.pathLength > 0 ? Math.ceil(metrics.pathLength / 0.2).toString() : '0'} unit="pts" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: 'blue' | 'coral' | 'sage' | 'cream' }) {
  const accentClasses = {
    blue: 'border-[#262624] bg-[#1b1b19] text-[#60a5fa]',
    coral: 'border-[#262624] bg-[#1b1b19] text-[#d97757]',
    sage: 'border-[#262624] bg-[#1b1b19] text-[#a7c4bc]',
    cream: 'border-[#262624] bg-[#1b1b19] text-[#f4f4f0]',
  };

  return (
    <div className={`border rounded-xl p-2.5 flex flex-col justify-between ${accentClasses[accent]}`}>
      <span className="text-[10px] text-[#8e8e89] uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold tracking-tight mt-1 font-mono">{value}</span>
    </div>
  );
}

function StateRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] py-0.5 border-b border-[#232321] last:border-0 font-mono">
      <span className="text-[#8e8e89] font-sans">{label}</span>
      <span className="text-[#f4f4f0] font-medium">
        {value} {unit && <span className="text-[#6e6e69] font-normal">{unit}</span>}
      </span>
    </div>
  );
}
