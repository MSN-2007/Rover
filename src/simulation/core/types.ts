// Core simulation types

export interface Vec2 {
  x: number;
  y: number;
}

export interface Pose {
  x: number;
  y: number;
  theta: number; // radians
}

export interface RobotState {
  pose: Pose;
  velocity: Vec2;
  angularVelocity: number;
  linearVelocity: number;
  path: Pose[];
  sensorReadings: LidarReading[];
  status: 'idle' | 'running' | 'paused' | 'goal_reached' | 'stuck' | 'error';
}

export interface LidarReading {
  angle: number;
  distance: number;
  hit: boolean;
  hitPoint: Vec2;
}

export interface GridCell {
  x: number;
  y: number;
  occupied: boolean;
  explored: boolean;
  covered: boolean;
  dirtProbability: number;
  dirtAfter: number;
  passes: number;
  cost: number;
}

export interface Grid {
  width: number;
  height: number;
  resolution: number; // meters per cell
  cells: GridCell[][];
  originX: number;
  originY: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'furniture' | 'dynamic' | 'unknown';
  label?: string;
  velocity?: Vec2; // for dynamic obstacles
}

export interface DynamicObstacle extends Obstacle {
  velocity: Vec2;
  path: Vec2[];
  pathIndex: number;
  predictedPositions: Vec2[];
}

export interface Environment {
  width: number;       // meters
  height: number;      // meters
  walls: Obstacle[];
  furniture: Obstacle[];
  dynamicObstacles: DynamicObstacle[];
  dirtRegions: DirtRegion[];
  rooms: Room[];
  grid: Grid;
}

export interface DirtRegion {
  x: number;
  y: number;
  radius: number;
  intensity: number; // 0-1
}

export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface SimulationConfig {
  mapType: 'empty' | 'furniture' | 'corridor' | 'multi_room' | 'random' | 'custom';
  mapWidth: number;
  mapHeight: number;
  gridResolution: number;
  startPose: Pose;
  goalPosition: Vec2;
  obstacleCount: number;
  dynamicObstacleCount: number;
  sensorNoise: number;       // 0-1
  wheelSlip: number;         // 0-1
  localizationNoise: number; // 0-1
  lidarRange: number;        // meters
  lidarNoise: number;        // 0-1
  maxLinearVelocity: number; // m/s
  maxAngularVelocity: number; // rad/s
  maxAcceleration: number;   // m/s²
  randomSeed: number;
  simulationSpeed: number;   // 1 = real time, 2 = 2x etc
  timeLimit: number;         // seconds, 0 = unlimited
}

export type ExperimentMode =
  | 'localization'
  | 'slam'
  | 'path_planning'
  | 'local_navigation'
  | 'coverage'
  | 'dynamic_obstacles'
  | 'dirt_detection'
  | 'task_planning'
  | 'cleaning_verification'
  | 'full_autonomous';

export interface MetricsSnapshot {
  timestamp: number;
  // Path planning
  pathLength: number;
  planningTime: number;
  nodesExplored: number;
  turns: number;
  collisions: number;
  goalDistance: number;
  pathOptimality: number;
  // Navigation
  timeToGoal: number;
  minObstacleDistance: number;
  replanningCount: number;
  velocitySmoothness: number;
  // Localization
  positionError: number;
  orientationError: number;
  rmse: number;
  maxError: number;
  drift: number;
  // Coverage
  coveragePercentage: number;
  uncoveredArea: number;
  overlapPercentage: number;
  revisits: number;
  cleaningTime: number;
  // SLAM
  mapAccuracy: number;
  trajectoryError: number;
  mapCompletionTime: number;
  // Dynamic obstacles
  minClearance: number;
  predictionError: number;
  replanTime: number;
  // Dirt
  dirtDetected: number;
  dirtRemoved: number;
  dirtReduction: number;
  verificationConfidence: number;
}

export interface AlgorithmResult {
  algorithmId: string;
  startTime: number;
  endTime: number;
  success: boolean;
  metrics: MetricsSnapshot;
  path?: Vec2[];
  openSet?: Vec2[];
  closedSet?: Vec2[];
  candidateTrajectories?: Vec2[][];
  selectedTrajectory?: Vec2[];
  internalState?: Record<string, unknown>;
}

export interface ExperimentRecord {
  id: string;
  createdAt: number;
  mode: ExperimentMode;
  config: SimulationConfig;
  algorithms: string[];
  results: AlgorithmResult[];
  winner?: string;
  winnerReason?: string;
  weights: Record<string, number>;
}

export interface VisualizationState {
  showPlannedPath: boolean;
  showActualPath: boolean;
  showSensorRays: boolean;
  showExploredNodes: boolean;
  showCostmap: boolean;
  showOccupancyGrid: boolean;
  showDynamicPredictions: boolean;
  showDirtMap: boolean;
  showCoverage: boolean;
  showTrajectory: boolean;
  showOpenSet: boolean;
  showClosedSet: boolean;
  showCandidateTrajectories: boolean;
  explainMode: boolean;
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
}
