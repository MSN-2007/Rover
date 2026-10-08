// Algorithm interfaces - all algorithms implement these

import { Vec2, Pose, Grid, Environment, MetricsSnapshot } from '../simulation/core/types';

export interface AlgorithmState {
  running: boolean;
  finished: boolean;
  success: boolean;
  stepCount: number;
  elapsedTime: number;
  internalData: Record<string, unknown>;
}

// --- PATH PLANNER INTERFACE ---
export interface PathPlannerResult {
  path: Vec2[];
  openSet: { x: number; y: number }[];
  closedSet: { x: number; y: number }[];
  nodesExplored: number;
  planningTime: number;
  cost: number;
}

export interface PathPlanner {
  readonly id: string;
  readonly name: string;
  initialize(grid: Grid, start: Vec2, goal: Vec2): void;
  step(): boolean; // returns true when done
  getResult(): PathPlannerResult;
  getState(): AlgorithmState;
  reset(): void;
  runFull(): PathPlannerResult; // Run to completion synchronously
}

// --- LOCAL PLANNER INTERFACE ---
export interface TrajectoryCandidate {
  v: number; // linear velocity
  w: number; // angular velocity
  trajectory: Vec2[];
  score: number;
  collides: boolean;
  label?: string;
}

export interface LocalPlannerResult {
  cmdLinear: number;
  cmdAngular: number;
  candidateTrajectories: TrajectoryCandidate[];
  selectedTrajectory: Vec2[];
}

export interface LocalPlanner {
  readonly id: string;
  readonly name: string;
  initialize(config: LocalPlannerConfig): void;
  compute(pose: Pose, goalPose: Vec2, env: Environment): LocalPlannerResult;
  reset(): void;
}

export interface LocalPlannerConfig {
  maxLinearVel: number;
  maxAngularVel: number;
  maxAccelLinear: number;
  maxAccelAngular: number;
  dt: number;
  horizonTime: number;
  robotRadius: number;
}

// --- COVERAGE PLANNER INTERFACE ---
export interface CoveragePlannerResult {
  waypoints: Vec2[];
  coveredCells: { x: number; y: number }[];
  totalDistance: number;
}

export interface CoveragePlanner {
  readonly id: string;
  readonly name: string;
  initialize(grid: Grid, start: Vec2): void;
  plan(): CoveragePlannerResult;
  reset(): void;
}

// --- LOCALIZER INTERFACE ---
export interface LocalizerResult {
  estimatedPose: Pose;
  positionError: number;
  orientationError: number;
  covariance: number[];
  particles?: Pose[]; // for particle filter
}

export interface Localizer {
  readonly id: string;
  readonly name: string;
  initialize(startPose: Pose): void;
  update(odometry: { dl: number; dr: number; dt: number }, observations?: Vec2[]): LocalizerResult;
  reset(): void;
}

// --- SLAM INTERFACE ---
export interface SLAMResult {
  estimatedPose: Pose;
  occupancyGrid: number[][]; // -1 unknown, 0 free, 1 occupied
  trajectory: Pose[];
  loopClosure: boolean;
}

export interface SLAMAlgorithm {
  readonly id: string;
  readonly name: string;
  initialize(mapWidth: number, mapHeight: number, resolution: number): void;
  update(pose: Pose, lidarReadings: { angle: number; distance: number }[]): SLAMResult;
  reset(): void;
}
