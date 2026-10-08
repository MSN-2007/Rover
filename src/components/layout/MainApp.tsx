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
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1b1b19] border border-[#262624] text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isRunning && !isPaused ? 'bg-[#10b981] animate-pulse' : 'bg-[#d97757]'}`} />
              <span className="text-[#8e8e89]">{isRunning && !isPaused ? 'ROVER ROVING' : 'SYSTEM READY'}</span>
            </div>

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

                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex items-center gap-1 bg-[#141413] p-1 rounded-lg border border-[#262624] text-[11px]">
                        {[
                          { id: 'furniture', label: 'Living Room' },
                          { id: 'multi_room', label: 'Apartment' },
                          { id: 'corridor', label: 'Hallways' },
                          { id: 'random', label: 'Obstacles' },
                        ].map(env => {
                          const active = useSimulationStore.getState().config.mapType === env.id;
                          return (
                            <button
                              key={env.id}
                              onClick={() => {
                                useSimulationStore.getState().setConfig({ mapType: env.id as any });
                                useSimulationStore.getState().initSimulation();
                              }}
                              className={`px-2.5 py-1 rounded-md transition-all font-sans ${
                                active
                                  ? 'bg-[#262622] text-[#f4f4f0] font-medium border border-[#383834] shadow-sm'
                                  : 'text-[#8e8e89] hover:text-[#f4f4f0] hover:bg-[#1a1a18]'
                              }`}
                            >
                              {env.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-xs text-[#8e8e89] font-mono bg-[#141413] px-2.5 py-1.5 rounded-lg border border-[#262624]">
                        Algorithm: <strong className="text-[#60a5fa] font-semibold">{selectedAlgorithms[0]?.toUpperCase() ?? 'A*'}</strong>
                      </div>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Model 1: A* Search (Claude Fable Blue) */}
                    <div
                      onClick={() => selectAlgorithm('astar')}
                      className={`cursor-pointer rounded-xl border overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl ${
                        selectedAlgorithms.includes('astar')
                          ? 'bg-[#1b1b19] border-[#60a5fa] ring-1 ring-[#60a5fa]/60 shadow-lg'
                          : 'bg-[#1b1b19] border-[#262624] hover:border-[#383834]'
                      }`}
                    >
                      <div>
                        {/* Top Colored Illustration Banner */}
                        <div className="w-full h-24 bg-[#60a5fa] flex items-center justify-center relative overflow-hidden">
                          <svg className="w-12 h-12 text-[#141413] transition-transform duration-300 group-hover:scale-110" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="24" cy="24" r="8" fill="#141413" fillOpacity="0.1" />
                            <circle cx="16" cy="18" r="3" fill="#141413" />
                            <circle cx="32" cy="18" r="3" fill="#141413" />
                            <circle cx="24" cy="30" r="3" fill="#141413" />
                            <circle cx="24" cy="12" r="2.5" fill="#141413" />
                            <line x1="16" y1="18" x2="24" y2="30" />
                            <line x1="32" y1="18" x2="24" y2="30" />
                            <line x1="16" y1="18" x2="24" y2="12" />
                            <line x1="32" y1="18" x2="24" y2="12" />
                          </svg>
                          {selectedAlgorithms.includes('astar') && (
                            <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#141413] text-[#60a5fa] px-1.5 py-0.5 rounded shadow">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="p-3.5 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-[#f4f4f0] group-hover:text-[#60a5fa] transition-colors">A* Search</div>
                            <span className="text-[10px] font-mono text-[#8e8e89]">O(V log V)</span>
                          </div>
                          <div className="text-xs text-[#8e8e89] mt-0.5">Most capable · Research</div>
                        </div>
                      </div>
                      <div className="p-3.5 pt-0 flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-[#242422] text-[#d1d1cd] px-2 py-0.5 rounded-md font-medium">Optimal</span>
                        <span className="text-[10px] bg-[#242422] text-[#d1d1cd] px-2 py-0.5 rounded-md font-medium">Shortest-path</span>
                      </div>
                    </div>

                    {/* Model 2: D* Lite (Claude Opus Coral) */}
                    <div
                      onClick={() => selectAlgorithm('dstarlite')}
                      className={`cursor-pointer rounded-xl border overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl ${
                        selectedAlgorithms.includes('dstarlite')
                          ? 'bg-[#1b1b19] border-[#d97757] ring-1 ring-[#d97757]/60 shadow-lg'
                          : 'bg-[#1b1b19] border-[#262624] hover:border-[#383834]'
                      }`}
                    >
                      <div>
                        {/* Top Coral Banner */}
                        <div className="w-full h-24 bg-[#e07a5f] flex items-center justify-center relative overflow-hidden">
                          <svg className="w-12 h-12 text-[#141413] transition-transform duration-300 group-hover:scale-110" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="20" cy="16" r="3" fill="#141413" />
                            <circle cx="12" cy="28" r="3" fill="#141413" />
                            <circle cx="28" cy="28" r="3" fill="#141413" />
                            <line x1="20" y1="16" x2="12" y2="28" />
                            <line x1="20" y1="16" x2="28" y2="28" />
                            <path d="M26 22 L36 28 L30 31 L34 38 L30 40 L26 33 L22 36 Z" fill="#141413" />
                          </svg>
                          {selectedAlgorithms.includes('dstarlite') && (
                            <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#141413] text-[#d97757] px-1.5 py-0.5 rounded shadow">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="p-3.5 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-[#f4f4f0] group-hover:text-[#d97757] transition-colors">D* Lite</div>
                            <span className="text-[10px] font-mono text-[#8e8e89]">O(Replanning)</span>
                          </div>
                          <div className="text-xs text-[#8e8e89] mt-0.5">Complex dynamic · Agents</div>
                        </div>
                      </div>
                      <div className="p-3.5 pt-0 flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-[#242422] text-[#d1d1cd] px-2 py-0.5 rounded-md font-medium">Adaptive</span>
                        <span className="text-[10px] bg-[#242422] text-[#d1d1cd] px-2 py-0.5 rounded-md font-medium">Replanning</span>
                      </div>
                    </div>

                    {/* Model 3: DWA Local (Claude Sonnet Cream) */}
                    <div
                      onClick={() => selectAlgorithm('dwa')}
                      className={`cursor-pointer rounded-xl border overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl ${
                        selectedAlgorithms.includes('dwa')
                          ? 'bg-[#1b1b19] border-[#faf7f2] ring-1 ring-[#faf7f2]/60 shadow-lg'
                          : 'bg-[#1b1b19] border-[#262624] hover:border-[#383834]'
                      }`}
                    >
                      <div>
                        {/* Top Cream Banner */}
                        <div className="w-full h-24 bg-[#f4efe6] flex items-center justify-center relative overflow-hidden">
                          <svg className="w-12 h-12 text-[#141413] transition-transform duration-300 group-hover:scale-110" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="24" y1="10" x2="24" y2="38" />
                            <line x1="10" y1="24" x2="38" y2="24" />
                            <line x1="14" y1="14" x2="34" y2="34" />
                            <line x1="14" y1="34" x2="34" y2="14" />
                            <circle cx="24" cy="24" r="5" fill="#141413" />
                            <circle cx="24" cy="10" r="2.5" fill="#141413" />
                            <circle cx="24" cy="38" r="2.5" fill="#141413" />
                            <circle cx="10" cy="24" r="2.5" fill="#141413" />
                            <circle cx="38" cy="24" r="2.5" fill="#141413" />
                          </svg>
                          {selectedAlgorithms.includes('dwa') && (
                            <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#141413] text-[#faf7f2] px-1.5 py-0.5 rounded shadow">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="p-3.5 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-[#f4f4f0] group-hover:text-[#faf7f2] transition-colors">DWA Local</div>
                            <span className="text-[10px] font-mono text-[#8e8e89]">O(V_s × V_w)</span>
                          </div>
                          <div className="text-xs text-[#8e8e89] mt-0.5">Everyday tasks · Obstacles</div>
                        </div>
                      </div>
                      <div className="p-3.5 pt-0 flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-[#242422] text-[#d1d1cd] px-2 py-0.5 rounded-md font-medium">Kinematic</span>
                        <span className="text-[10px] bg-[#242422] text-[#d1d1cd] px-2 py-0.5 rounded-md font-medium">Safe</span>
                      </div>
                    </div>

                    {/* Model 4: Boustrophedon (Claude Haiku Sage) */}
                    <div
                      onClick={() => selectAlgorithm('boustrophedon')}
                      className={`cursor-pointer rounded-xl border overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl ${
                        selectedAlgorithms.includes('boustrophedon')
                          ? 'bg-[#1b1b19] border-[#a7c4bc] ring-1 ring-[#a7c4bc]/60 shadow-lg'
                          : 'bg-[#1b1b19] border-[#262624] hover:border-[#383834]'
                      }`}
                    >
                      <div>
                        {/* Top Sage Banner with New Badge */}
                        <div className="w-full h-24 bg-[#b4d2c8] flex items-center justify-center relative overflow-hidden">
                          <svg className="w-12 h-12 text-[#141413] transition-transform duration-300 group-hover:scale-110" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 28 L24 14 L36 28 L24 22 Z" fill="#141413" fillOpacity="0.2" />
                            <path d="M12 28 L24 14 L36 28 L24 38 Z" stroke="#141413" />
                            <line x1="24" y1="14" x2="24" y2="38" />
                          </svg>
                          <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#141413] text-[#b4d2c8] px-1.5 py-0.5 rounded shadow">
                            {selectedAlgorithms.includes('boustrophedon') ? 'ACTIVE' : 'PBL'}
                          </span>
                        </div>
                        <div className="p-3.5 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-[#f4f4f0] group-hover:text-[#a7c4bc] transition-colors">Boustrophedon</div>
                            <span className="text-[10px] font-mono text-[#8e8e89]">O(Coverage)</span>
                          </div>
                          <div className="text-xs text-[#8e8e89] mt-0.5">Fastest sweep · Complete</div>
                        </div>
                      </div>
                      <div className="p-3.5 pt-0 flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] bg-[#242422] text-[#d1d1cd] px-2 py-0.5 rounded-md font-medium">95%+ Area</span>
                        <span className="text-[10px] bg-[#242422] text-[#d1d1cd] px-2 py-0.5 rounded-md font-medium">Cellular</span>
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
