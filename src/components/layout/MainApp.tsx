'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ExperimentControls from '@/components/simulation/ExperimentControls';
import MetricsPanel from '@/components/metrics/MetricsPanel';
import VisualizationToggles from '@/components/simulation/VisualizationToggles';
import AlgorithmInfoPanel from '@/components/algorithms/AlgorithmInfoPanel';
import ComparisonPanel from '@/components/metrics/ComparisonPanel';
import { useSimulationStore } from '@/store/simulationStore';
import { getAllAlgorithms } from '@/data/algorithms';
import {
  LayoutDashboard,
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  BarChart3,
  BookOpen,
  Settings,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Wind,
  Layers,
  Compass,
  Cpu,
  Download,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const SimulationCanvas = dynamic(() => import('@/components/simulation/SimulationCanvas'), { ssr: false });

type NavItem = 'dashboard' | 'simulation' | 'compare' | 'algorithms' | 'settings';

export default function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    mode, isRunning, isPaused, metrics, robotState, initSimulation,
    runSimulation, pauseSimulation, resetSimulation,
    selectedAlgorithms, selectAlgorithm,
    suctionMode, setSuctionMode, batteryLevel, dirtCollectedGrams, dirtTotalGrams
  } = useSimulationStore();

  useEffect(() => {
    initSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleRun = () => {
    if (!isRunning) {
      runSimulation();
    } else {
      pauseSimulation();
    }
  };

  const coveragePercent = Math.min(100, metrics.coveragePercentage);
  const dirtPercent = dirtTotalGrams > 0 ? Math.min(100, (dirtCollectedGrams / dirtTotalGrams) * 100) : 0;

  return (
    <div className="flex h-screen w-screen bg-[#141413] text-[#f4f4f0] overflow-hidden font-sans select-none">
      {/* ========================================================= */}
      {/* CLAUDE CONSOLE SLIDE-IN / SLIDE-OUT LEFT SIDEBAR */}
      {/* ========================================================= */}
      <aside
        className={`h-full bg-[#141413] border-r border-[#262624] flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'w-64' : 'w-0 -translate-x-full overflow-hidden border-r-0'
        }`}
      >
        <div className="w-64 h-full flex flex-col p-3">
          {/* Top: Claude Console Header & Sidebar Toggle */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#f4f4f0] tracking-tight">Smart Vacuum Lab</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220] transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          {/* Workspace selector dropdown ("Default" style) */}
          <div className="mb-3">
            <button className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1b1b19] hover:bg-[#222220] border border-[#262624] text-xs text-[#d1d1cd] transition-all">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#d97757]" />
                <span className="font-medium truncate">PBL: Domestic Vacuum</span>
              </div>
              <ChevronDown size={13} className="text-[#8e8e89]" />
            </button>
          </div>

          {/* Search Console Input */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[#6e6e69]" />
            <input
              type="text"
              placeholder="Search Lab..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1b1b19] border border-[#262624] rounded-lg pl-8 pr-12 py-1.5 text-xs text-[#f4f4f0] placeholder-[#6e6e69] outline-none focus:border-[#3e3e3a] transition-all"
            />
            <span className="absolute right-2 top-2 text-[10px] font-mono text-[#6e6e69] bg-[#222220] border border-[#2a2a27] px-1 rounded">
              ⌘K
            </span>
          </div>

          {/* Navigation Links (Claude Console Menu) */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto text-xs pr-1">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                activeNav === 'dashboard'
                  ? 'bg-[#222220] text-[#f4f4f0] font-medium'
                  : 'text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#1a1a18]'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard & Rover</span>
            </button>

            <button
              onClick={() => setActiveNav('simulation')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all ${
                activeNav === 'simulation'
                  ? 'bg-[#222220] text-[#f4f4f0] font-medium'
                  : 'text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#1a1a18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Play size={15} />
                <span>Simulation Lab</span>
              </div>
              <ChevronRight size={13} className="text-[#6e6e69]" />
            </button>

            <button
              onClick={() => setActiveNav('compare')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all ${
                activeNav === 'compare'
                  ? 'bg-[#222220] text-[#f4f4f0] font-medium'
                  : 'text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#1a1a18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 size={15} />
                <span>Benchmark & Compare</span>
              </div>
              <ChevronRight size={13} className="text-[#6e6e69]" />
            </button>

            <button
              onClick={() => setActiveNav('algorithms')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all ${
                activeNav === 'algorithms'
                  ? 'bg-[#222220] text-[#f4f4f0] font-medium'
                  : 'text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#1a1a18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={15} />
                <span>Algorithm Directory</span>
              </div>
              <ChevronRight size={13} className="text-[#6e6e69]" />
            </button>

            <button
              onClick={() => setActiveNav('settings')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all ${
                activeNav === 'settings'
                  ? 'bg-[#222220] text-[#f4f4f0] font-medium'
                  : 'text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#1a1a18]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings size={15} />
                <span>Lab Settings</span>
              </div>
              <ChevronRight size={13} className="text-[#6e6e69]" />
            </button>
          </nav>

          {/* Bottom Sidebar: Notifications, Documentation & Profile */}
          <div className="pt-3 border-t border-[#262624] space-y-1 text-xs text-[#8e8e89]">
            <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#1a1a18] transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell size={14} />
                <span>Notifications</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#d97757]" />
            </div>

            <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#1a1a18] transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <BookOpen size={14} />
                <span>Documentation</span>
              </div>
              <ExternalLink size={12} className="text-[#6e6e69]" />
            </div>

            <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#1a1a18] transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono">Battery: {batteryLevel.toFixed(0)}%</span>
              </div>
              <button
                onClick={() => setSuctionMode(suctionMode === 'eco' ? 'standard' : suctionMode === 'standard' ? 'boost' : 'eco')}
                className="text-[10px] text-[#d97757] hover:underline uppercase font-bold"
              >
                {suctionMode}
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#1b1b19] border border-[#262624]">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#2d1e18] text-[#d97757] flex items-center justify-center font-bold text-xs">
                    M
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#f4f4f0] leading-tight">MOHD</div>
                    <div className="text-[10px] text-[#6e6e69] leading-tight">Robotics Lab</div>
                  </div>
                </div>
                <ChevronDown size={13} className="text-[#6e6e69]" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN VIEWPORT (CLAUDE CONSOLE WORKBENCH) */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#141413]">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-[#262624] bg-[#141413] flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-[#262624] bg-[#1b1b19] text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#222220] transition-all"
                title="Open sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}

            <div className="flex items-baseline gap-2">
              <h1 className="font-claude-serif text-xl font-normal text-[#f4f4f0] tracking-tight">
                Good morning, MOHD
              </h1>
              <span className="text-xs text-[#8e8e89] font-sans">
                / {activeNav === 'dashboard' ? 'Overview' : activeNav === 'simulation' ? 'Laboratory' : activeNav === 'compare' ? 'Benchmark' : 'Directory'}
              </span>
            </div>
          </div>

          {/* Top Right Action Pills (Claude Console style) */}
          <div className="flex items-center gap-2.5 text-xs">
            <button
              onClick={() => resetSimulation()}
              className="px-3 py-1.5 rounded-lg bg-[#1b1b19] hover:bg-[#222220] border border-[#262624] text-[#d1d1cd] font-medium transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Reset Rover</span>
            </button>

            <button
              onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
              className="p-1.5 rounded-lg bg-[#1b1b19] hover:bg-[#222220] border border-[#262624] text-[#d1d1cd] font-medium transition-all"
              title="Toggle drawer"
            >
              {rightDrawerOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            </button>

            <button
              onClick={handleToggleRun}
              className={`px-4 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shadow-sm ${
                isRunning && !isPaused
                  ? 'bg-[#d97757] text-[#ffffff] hover:bg-[#c26547]'
                  : 'bg-[#f4f4f0] text-[#141413] hover:bg-[#e4e4df]'
              }`}
            >
              {isRunning && !isPaused ? <Pause size={13} /> : <Play size={13} />}
              <span>{isRunning && !isPaused ? 'Pause Rover' : 'Rove Simulation'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeNav === 'dashboard' && (
              <>
                {/* 1. Stat Cards Row (Exact Claude Console Cards from Screenshot) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Cleaning coverage */}
                  <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#8e8e89] text-xs">
                      <span>Room coverage</span>
                      <Info size={13} className="text-[#6e6e69]" />
                    </div>
                    <div className="my-2">
                      <div className="font-claude-serif text-3xl font-normal text-[#f4f4f0]">
                        {coveragePercent.toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-[#8e8e89] mt-0.5">
                        {metrics.pathLength.toFixed(2)}m distance traversed
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#232321] flex items-center justify-between">
                      <span className="text-[11px] text-[#8e8e89]">Target 95%</span>
                      <button
                        onClick={() => setActiveNav('simulation')}
                        className="px-2.5 py-1 rounded bg-[#242422] hover:bg-[#2c2c29] text-[11px] text-[#f4f4f0] font-medium transition-all"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Dust Cleaned */}
                  <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#8e8e89] text-xs">
                      <span>Dust collected this run</span>
                      <Sparkles size={13} className="text-[#d97757]" />
                    </div>
                    <div className="my-2 flex items-center justify-between">
                      <div>
                        <div className="font-claude-serif text-3xl font-normal text-[#f4f4f0]">
                          {dirtCollectedGrams.toFixed(1)}g
                        </div>
                        <div className="text-[11px] text-[#8e8e89] mt-0.5">
                          of {dirtTotalGrams.toFixed(0)}g total room dust
                        </div>
                      </div>
                      {/* Circular Gauge like spend limit circle in screenshot */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-12 h-12 -rotate-90">
                          <circle cx="24" cy="24" r="20" stroke="#262624" strokeWidth="4" fill="transparent" />
                          <circle
                            cx="24" cy="24" r="20"
                            stroke="#d97757" strokeWidth="4"
                            strokeDasharray="125.6"
                            strokeDashoffset={125.6 - (125.6 * dirtPercent) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-300"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-mono text-[#f4f4f0]">{dirtPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#232321] flex items-center justify-between">
                      <span className="text-[11px] text-[#8e8e89]">Suction efficiency</span>
                      <span className="text-[11px] text-[#a7c4bc] font-medium">Nominal</span>
                    </div>
                  </div>

                  {/* Card 3: Motor & Sensor State */}
                  <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#8e8e89] text-xs">
                      <span>Suction motor power</span>
                      <Wind size={13} className="text-[#60a5fa]" />
                    </div>
                    <div className="my-2">
                      <div className="font-claude-serif text-3xl font-normal text-[#f4f4f0] uppercase">
                        {suctionMode}
                      </div>
                      <div className="text-[11px] text-[#8e8e89] mt-0.5">
                        2000 Pa suction / 14.4V battery
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#232321] flex items-center justify-between">
                      <span className="text-[11px] text-[#8e8e89]">Collisions: {metrics.collisions}</span>
                      <button
                        onClick={() => setSuctionMode(suctionMode === 'eco' ? 'standard' : suctionMode === 'standard' ? 'boost' : 'eco')}
                        className="px-2.5 py-1 rounded bg-[#242422] hover:bg-[#2c2c29] text-[11px] text-[#f4f4f0] font-medium transition-all"
                      >
                        Cycle Mode
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Simulation Canvas Main Stage (Where the Rover Roves!) */}
                <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-medium text-[#f4f4f0]">Autonomous Vacuum Rover Arena</h2>
                      <p className="text-xs text-[#8e8e89] mt-0.5">
                        Interactive domestic floor simulation with obstacle avoidance and dynamic dust absorption.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8e8e89] font-mono">
                        Algorithm: <strong className="text-[#60a5fa] font-semibold">{selectedAlgorithms[0]?.toUpperCase() ?? 'A*'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-[520px] rounded-lg overflow-hidden border border-[#262624]">
                    <SimulationCanvas />
                  </div>
                </div>

                {/* 3. Claude Models Selection Row (Replicating exact 4 cards from Claude Console screenshot!) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-[#f4f4f0]">Planning & Coverage Models</h2>
                    <button
                      onClick={() => setActiveNav('compare')}
                      className="text-xs text-[#60a5fa] hover:underline flex items-center gap-1"
                    >
                      Compare algorithms
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Model 1: A* (Fable blue style) */}
                    <div
                      onClick={() => selectAlgorithm('astar')}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        selectedAlgorithms.includes('astar')
                          ? 'bg-[#192333] border-[#60a5fa] shadow-sm'
                          : 'bg-[#1b1b19] border-[#262624] hover:border-[#383834]'
                      }`}
                    >
                      <div>
                        <div className="w-full h-20 rounded-lg bg-[#60a5fa]/20 border border-[#60a5fa]/30 flex items-center justify-center mb-3">
                          <Compass size={28} className="text-[#60a5fa]" />
                        </div>
                        <div className="font-semibold text-sm text-[#f4f4f0]">A* Heuristic Search</div>
                        <p className="text-xs text-[#8e8e89] mt-1 line-clamp-2">
                          Optimal global pathfinding with Euclidean guidance.
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-[#232321]">
                        <span className="text-[10px] bg-[#222220] px-2 py-0.5 rounded text-[#d1d1cd]">Optimal</span>
                        <span className="text-[10px] bg-[#222220] px-2 py-0.5 rounded text-[#d1d1cd]">Guaranteed</span>
                      </div>
                    </div>

                    {/* Model 2: D* Lite (Opus terracotta style) */}
                    <div
                      onClick={() => selectAlgorithm('dstarlite')}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        selectedAlgorithms.includes('dstarlite')
                          ? 'bg-[#2d1e18] border-[#d97757] shadow-sm'
                          : 'bg-[#1b1b19] border-[#262624] hover:border-[#383834]'
                      }`}
                    >
                      <div>
                        <div className="w-full h-20 rounded-lg bg-[#d97757]/20 border border-[#d97757]/30 flex items-center justify-center mb-3">
                          <Cpu size={28} className="text-[#d97757]" />
                        </div>
                        <div className="font-semibold text-sm text-[#f4f4f0]">D* Lite Incremental</div>
                        <p className="text-xs text-[#8e8e89] mt-1 line-clamp-2">
                          Instant graph repairs when dynamic obstacles appear.
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-[#232321]">
                        <span className="text-[10px] bg-[#222220] px-2 py-0.5 rounded text-[#d1d1cd]">Adaptive</span>
                        <span className="text-[10px] bg-[#222220] px-2 py-0.5 rounded text-[#d1d1cd]">Dynamic</span>
                      </div>
                    </div>

                    {/* Model 3: DWA Local (Sonnet cream/star style) */}
                    <div
                      onClick={() => selectAlgorithm('dwa')}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        selectedAlgorithms.includes('dwa')
                          ? 'bg-[#262622] border-[#faf7f2] shadow-sm'
                          : 'bg-[#1b1b19] border-[#262624] hover:border-[#383834]'
                      }`}
                    >
                      <div>
                        <div className="w-full h-20 rounded-lg bg-[#faf7f2]/10 border border-[#faf7f2]/20 flex items-center justify-center mb-3">
                          <Sparkles size={28} className="text-[#faf7f2]" />
                        </div>
                        <div className="font-semibold text-sm text-[#f4f4f0]">Dynamic Window (DWA)</div>
                        <p className="text-xs text-[#8e8e89] mt-1 line-clamp-2">
                          Kinematic obstacle avoidance adhering to acceleration limits.
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-[#232321]">
                        <span className="text-[10px] bg-[#222220] px-2 py-0.5 rounded text-[#d1d1cd]">Reactive</span>
                        <span className="text-[10px] bg-[#222220] px-2 py-0.5 rounded text-[#d1d1cd]">Safety</span>
                      </div>
                    </div>

                    {/* Model 4: Boustrophedon (Haiku sage style) */}
                    <div
                      onClick={() => selectAlgorithm('boustrophedon')}
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        selectedAlgorithms.includes('boustrophedon')
                          ? 'bg-[#192522] border-[#a7c4bc] shadow-sm'
                          : 'bg-[#1b1b19] border-[#262624] hover:border-[#383834]'
                      }`}
                    >
                      <div>
                        <div className="w-full h-20 rounded-lg bg-[#a7c4bc]/20 border border-[#a7c4bc]/30 flex items-center justify-center mb-3">
                          <Layers size={28} className="text-[#a7c4bc]" />
                        </div>
                        <div className="font-semibold text-sm text-[#f4f4f0]">Boustrophedon Sweep</div>
                        <p className="text-xs text-[#8e8e89] mt-1 line-clamp-2">
                          Cellular decomposition for guaranteed 95%+ coverage.
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-[#232321]">
                        <span className="text-[10px] bg-[#222220] px-2 py-0.5 rounded text-[#d1d1cd]">Complete</span>
                        <span className="text-[10px] bg-[#222220] px-2 py-0.5 rounded text-[#d1d1cd]">PBL Best</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeNav === 'simulation' && (
              <div className="h-[750px] flex gap-4">
                <div className="w-72 bg-[#1b1b19] border border-[#262624] rounded-xl p-4 overflow-y-auto">
                  <ExperimentControls />
                </div>
                <div className="flex-1 bg-[#1b1b19] border border-[#262624] rounded-xl p-3 overflow-hidden">
                  <SimulationCanvas />
                </div>
              </div>
            )}

            {activeNav === 'compare' && (
              <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-5">
                <ComparisonPanel />
              </div>
            )}

            {activeNav === 'algorithms' && (
              <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-5">
                <AlgorithmInfoPanel />
              </div>
            )}

            {activeNav === 'settings' && (
              <div className="bg-[#1b1b19] border border-[#262624] rounded-xl p-6 max-w-2xl space-y-4">
                <h2 className="font-claude-serif text-xl font-normal text-[#f4f4f0]">Lab Settings & Parameters</h2>
                <p className="text-xs text-[#8e8e89]">
                  Configure physical constraints, environment size, and sensor simulation properties.
                </p>
                <div className="pt-3 border-t border-[#262624] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#d1d1cd]">Vacuum Chassis Radius</span>
                    <span className="font-mono text-[#8e8e89]">0.24 m (Roborock spec)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#d1d1cd]">LiDAR Range</span>
                    <span className="font-mono text-[#8e8e89]">4.5 m (360° laser sweep)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#d1d1cd]">Floor Resolution</span>
                    <span className="font-mono text-[#8e8e89]">0.20 m per cell</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#d1d1cd]">Autonomous Cleaning Mode</span>
                    <span className="font-mono text-[#60a5fa]">Boustrophedon Sweep</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SLIDE-IN / SLIDE-OUT RIGHT DRAWER (TELEMETRY & INFO) */}
          {/* ========================================================= */}
          <aside
            className={`h-full bg-[#141413] border-l border-[#262624] flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
              rightDrawerOpen ? 'w-80' : 'w-0 -translate-x-full overflow-hidden border-l-0'
            }`}
          >
            <div className="w-80 h-full flex flex-col p-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#262624] mb-3">
                <span className="font-medium text-xs text-[#f4f4f0]">Rover Telemetry & Diagnostic</span>
                <button
                  onClick={() => setRightDrawerOpen(false)}
                  className="p-1 rounded text-[#8e8e89] hover:text-[#f4f4f0]"
                >
                  <PanelRightClose size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                <MetricsPanel />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
