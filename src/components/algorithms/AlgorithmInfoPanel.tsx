'use client';

import React, { useState } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { getAlgorithmById, AlgorithmInfo } from '@/data/algorithms';
import { BookOpen, Zap, AlertTriangle, Settings, Trophy, XCircle, FileText, Activity, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'howit', label: 'Mechanics & Math', icon: Activity },
  { id: 'advantages', label: 'Strengths', icon: Trophy },
  { id: 'disadvantages', label: 'Limitations', icon: XCircle },
  { id: 'parameters', label: 'Parameters', icon: Settings },
  { id: 'paper', label: 'Literature', icon: FileText },
  { id: 'failure', label: 'Edge Cases', icon: AlertTriangle },
];

export default function AlgorithmInfoPanel() {
  const { selectedAlgorithms } = useSimulationStore();
  const [activeTab, setActiveTab] = useState('overview');

  const algId = selectedAlgorithms[0];
  const alg = algId ? getAlgorithmById(algId) : null;

  if (!alg) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 font-mono text-xs">
        Select an algorithm to inspect architectural specifications
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="p-3 bg-[#0c0e15] border-b border-[#1e2434]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{alg.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-semibold">
                {alg.category}
              </span>
              <span className="text-[10px] text-slate-400">{alg.year}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                alg.projectSuitability === 'high'
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                  : alg.projectSuitability === 'medium'
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/30'
                  : 'bg-rose-600/20 text-rose-300 border-rose-500/30'
              }`}>
                {alg.projectSuitability.toUpperCase()} PBL SUITABILITY
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {alg.authors.slice(0, 2).join(', ')}{alg.authors.length > 2 ? ' et al.' : ''}
            </div>
          </div>
          {alg.realTimeSuitable && (
            <span className="text-[10px] bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
              <Zap size={10} /> Real-Time
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-[#1e2434] bg-[#090b10] flex-shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] whitespace-nowrap transition-all border-b-2 ${
                active
                  ? 'text-blue-300 border-blue-500 bg-blue-950/20 font-medium'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#121622]'
              }`}
            >
              <Icon size={11} className={active ? 'text-blue-400' : 'text-slate-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0c0e15] pr-1">
        {activeTab === 'overview' && <OverviewTab alg={alg} />}
        {activeTab === 'howit' && <HowItWorksTab alg={alg} />}
        {activeTab === 'advantages' && <AdvantagesTab alg={alg} />}
        {activeTab === 'disadvantages' && <DisadvantagesTab alg={alg} />}
        {activeTab === 'parameters' && <ParametersTab alg={alg} />}
        {activeTab === 'paper' && <PaperTab alg={alg} />}
        {activeTab === 'failure' && <FailureTab alg={alg} />}
      </div>
    </div>
  );
}

function OverviewTab({ alg }: { alg: AlgorithmInfo }) {
  return (
    <div className="space-y-3.5">
      <div>
        <div className="text-blue-400 uppercase tracking-wider text-[10px] font-bold mb-1">Theoretical Summary</div>
        <p className="text-slate-300 leading-relaxed text-xs">{alg.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#121622] border border-[#1e2434] rounded-lg p-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Time Complexity</div>
          <div className="text-emerald-400 font-bold mt-0.5">{alg.complexity.time ?? 'O(V log V + E)'}</div>
        </div>
        <div className="bg-[#121622] border border-[#1e2434] rounded-lg p-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Space Complexity</div>
          <div className="text-amber-400 font-bold mt-0.5">{alg.complexity.space ?? 'O(V)'}</div>
        </div>
      </div>

      <div>
        <div className="text-blue-400 uppercase tracking-wider text-[10px] font-bold mb-1">Inputs Required</div>
        <ul className="space-y-1">
          {alg.inputs.map((inp, k) => (
            <li key={k} className="text-slate-300 flex items-center gap-1.5">
              <span className="text-blue-500 font-bold">›</span> {inp}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-blue-400 uppercase tracking-wider text-[10px] font-bold mb-1">Outputs Generated</div>
        <ul className="space-y-1">
          {alg.outputs.map((out, k) => (
            <li key={k} className="text-slate-300 flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">›</span> {out}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-blue-400 uppercase tracking-wider text-[10px] font-bold mb-1.5">Suitable Robot Environments</div>
        <div className="flex flex-wrap gap-1.5">
          {alg.suitableEnvironments.map((env, k) => (
            <span key={k} className="bg-[#141926] border border-[#222938] text-slate-300 px-2 py-0.5 rounded text-[10px]">
              {env}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorksTab({ alg }: { alg: AlgorithmInfo }) {
  const descriptions: Record<string, React.ReactNode> = {
    astar: (
      <div className="space-y-2.5 text-slate-300 text-xs">
        <p>A* evaluates nodes using the evaluation function:</p>
        <div className="bg-[#121622] border border-[#1e2434] rounded-lg p-3 font-mono text-center">
          <span className="text-emerald-400 font-bold">f(n) = g(n) + h(n)</span>
        </div>
        <div className="space-y-1.5">
          <div><strong className="text-emerald-400">g(n)</strong>: Exact cumulative distance traversed from the start node to n.</div>
          <div><strong className="text-cyan-400">h(n)</strong>: Admissible Euclidean/Octile heuristic estimate from node n to the goal.</div>
          <div><strong className="text-blue-400">f(n)</strong>: Total estimated path cost through n.</div>
        </div>
        <p className="text-slate-400 leading-relaxed pt-1">
          Nodes enter the priority queue (Open Set, visualized in amber). The minimum f(n) node is popped, inspected, and moved to the Closed Set (visualized in slate-indigo). If the heuristic never overestimates the true cost, A* guarantees shortest-path optimality.
        </p>
      </div>
    ),
    dijkstra: (
      <div className="space-y-2.5 text-slate-300 text-xs">
        <p>Dijkstra&apos;s algorithm expands nodes in strict non-decreasing order of cost from the starting vertex, equivalent to A* with <span className="text-emerald-400 font-semibold">h(n) = 0</span>.</p>
        <p className="text-slate-400">
          Because it does not utilize directional goal guidance, the frontier expands uniformly in all directions like a circular wavefront. While optimal, it explores 3× to 4× more nodes than A* on standard domestic grids.
        </p>
      </div>
    ),
    dstarlite: (
      <div className="space-y-2.5 text-slate-300 text-xs">
        <p>D* Lite performs incremental heuristic search based on Lifelong Planning A* (LPA*).</p>
        <p className="text-slate-400">
          When dynamic obstacles or doors close in front of the vacuum, D* Lite reuses previous search trees and only repairs the inconsistent nodes (rhs(u) ≠ g(u)) rather than planning from scratch, saving critical micro-controller compute cycles.
        </p>
      </div>
    ),
    dwa: (
      <div className="space-y-2.5 text-slate-300 text-xs">
        <p>Dynamic Window Approach (DWA) accounts for the vacuum cleaner&apos;s physical acceleration limits:</p>
        <div className="bg-[#121622] border border-[#1e2434] rounded-lg p-2.5 font-mono text-center text-blue-300">
          V_d = [v ± a_lin · dt] ∩ [ω ± a_ang · dt]
        </div>
        <p className="text-slate-400">
          DWA generates dozens of short circular arc trajectories for 1.5 seconds into the future, eliminates those causing collisions, and scores the remaining by Goal Alignment, Obstacle Clearance, and Forward Velocity.
        </p>
      </div>
    ),
    boustrophedon: (
      <div className="space-y-2.5 text-slate-300 text-xs">
        <p>Boustrophedon cellular decomposition (&quot;as the ox turns in plowing&quot;) guarantees complete room coverage:</p>
        <p className="text-slate-400">
          The environment is sliced into collision-free convex cells at obstacle vertices. Within each cell, the robot drives parallel back-and-forth passes matched to the vacuum cleaning swath (0.35m), minimizing overlapping passes and turn energy.
        </p>
      </div>
    ),
  };

  const content = descriptions[alg.id] ?? (
    <div className="space-y-2 text-slate-300">
      <p className="leading-relaxed">{alg.description}</p>
      <div className="text-blue-400 font-bold uppercase tracking-wider text-[10px] pt-1">Applications</div>
      <ul className="space-y-1">
        {alg.applications.map((a, k) => <li key={k} className="text-slate-400">› {a}</li>)}
      </ul>
    </div>
  );

  return <div>{content}</div>;
}

function AdvantagesTab({ alg }: { alg: AlgorithmInfo }) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Engineered Strengths</div>
      <div className="space-y-2">
        {alg.advantages.map((adv, k) => (
          <div key={k} className="flex gap-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2.5 text-xs text-slate-300">
            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{adv}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#121622] border border-[#1e2434] rounded-lg p-3">
        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">PBL Recommendation Rationale</div>
        <p className="text-slate-300 text-xs leading-relaxed">{alg.projectSuitabilityReason}</p>
      </div>
    </div>
  );
}

function DisadvantagesTab({ alg }: { alg: AlgorithmInfo }) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Operational Limitations</div>
      <div className="space-y-2">
        {alg.disadvantages.map((dis, k) => (
          <div key={k} className="flex gap-2.5 bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5 text-xs text-slate-300">
            <XCircle size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{dis}</span>
          </div>
        ))}
      </div>

      {alg.projectNotSuitableReason && (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-3">
          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">When to Avoid</div>
          <p className="text-slate-300 text-xs leading-relaxed">{alg.projectNotSuitableReason}</p>
        </div>
      )}
    </div>
  );
}

function ParametersTab({ alg }: { alg: AlgorithmInfo }) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Tunable Algorithm Parameters</div>
      {alg.parameters.length === 0 ? (
        <div className="text-slate-500">Parameterless deterministic implementation.</div>
      ) : (
        <div className="space-y-2">
          {alg.parameters.map((p, k) => (
            <div key={k} className="bg-[#121622] border border-[#1e2434] rounded-lg p-3">
              <div className="text-purple-300 font-bold text-xs">{p.name}</div>
              <div className="text-slate-400 text-xs mt-1 leading-relaxed">{p.description}</div>
              <div className="flex gap-4 mt-2 text-[11px]">
                <span className="text-emerald-400">Baseline: <strong>{p.typical}</strong></span>
                {p.range && <span className="text-blue-400">Bounds: <strong>{p.range}</strong></span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaperTab({ alg }: { alg: AlgorithmInfo }) {
  return (
    <div className="space-y-3.5">
      <div className="bg-[#121622] border border-[#1e2434] rounded-lg p-3.5 space-y-2">
        <div className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Academic Reference</div>
        <div className="text-white font-bold leading-relaxed text-xs">{alg.paper.title}</div>
        <div className="text-slate-400 text-xs">{alg.authors.join(', ')}</div>
        <div className="text-slate-500 text-[11px]">{alg.year} · {alg.paper.venue}</div>
        {alg.paper.doi && (
          <div className="text-blue-400 text-[11px]">DOI: {alg.paper.doi}</div>
        )}
        {alg.paper.url && alg.paper.url !== 'N/A' && (
          <a
            href={alg.paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 bg-blue-600/20 border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded text-xs hover:bg-blue-600/30 transition-all"
          >
            <span>View Publication</span>
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      <div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Related Algorithms</div>
        <div className="flex flex-wrap gap-1.5">
          {alg.relatedAlgorithms.map((rel, k) => (
            <span key={k} className="bg-[#141926] border border-[#222938] text-slate-300 px-2 py-0.5 rounded text-[10px]">
              {rel}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FailureTab({ alg }: { alg: AlgorithmInfo }) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Known Failure Cases & Local Minima</div>
      <div className="space-y-2">
        {alg.failureCases.map((f, k) => (
          <div key={k} className="flex gap-2.5 bg-amber-950/20 border border-amber-900/30 rounded-lg p-2.5 text-xs text-slate-300">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
