import { create } from 'zustand';
import { SimulationConfig, RobotState, Environment, MetricsSnapshot, ExperimentMode, VisualizationState, AlgorithmResult, Pose, Vec2, Obstacle, DirtRegion } from '../simulation/core/types';
import { generateEnvironment, worldToGrid, isValidCell } from '../simulation/environment/environment';
import { createRobot, RobotPhysics, updateRobotPhysics, simulateLidar, checkCollision } from '../simulation/robot/robot';
import { normalizeAngle, distance2 } from '../simulation/core/utils';
import { PathPlanner, PathPlannerResult, LocalPlannerConfig } from '../algorithms/interfaces';
import { AStarPlanner } from '../algorithms/planning/AStar';
import { DijkstraPlanner } from '../algorithms/planning/Dijkstra';
import { DStarLitePlanner } from '../algorithms/planning/DStarLite';
import { RRTPlanner, RRTStarPlanner } from '../algorithms/planning/RRT';
import { DWAPlanner, VFHPlanner } from '../algorithms/navigation/LocalPlanners';
import { BoustrophedonPlanner, STCPlanner, LawnmowerPlanner } from '../algorithms/coverage/CoveragePlanners';

export type CanvasTool = 'inspect' | 'set_goal' | 'set_robot' | 'add_obstacle' | 'add_dirt' | 'erase';
export type SuctionMode = 'eco' | 'standard' | 'boost';

const DEFAULT_CONFIG: SimulationConfig = {
  mapType: 'furniture',
  mapWidth: 10,
  mapHeight: 8,
  gridResolution: 0.2,
  startPose: { x: 1.2, y: 1.2, theta: 0 },
  goalPosition: { x: 8.5, y: 6.5 },
  obstacleCount: 5,
  dynamicObstacleCount: 2,
  sensorNoise: 0.02,
  wheelSlip: 0.02,
  localizationNoise: 0.01,
  lidarRange: 4.5,
  lidarNoise: 0.02,
  maxLinearVelocity: 0.55,
  maxAngularVelocity: 1.6,
  maxAcceleration: 0.6,
  randomSeed: 42,
  simulationSpeed: 1,
  timeLimit: 180,
};

const DEFAULT_VIZ: VisualizationState = {
  showPlannedPath: true,
  showActualPath: true,
  showSensorRays: true,
  showExploredNodes: false,
  showCostmap: false,
  showOccupancyGrid: false,
  showDynamicPredictions: true,
  showDirtMap: true,
  showCoverage: true,
  showTrajectory: false,
  showOpenSet: false,
  showClosedSet: false,
  showCandidateTrajectories: true,
  explainMode: false,
  cameraX: 0,
  cameraY: 0,
  cameraZoom: 1,
};

interface SimState {
  config: SimulationConfig;
  mode: ExperimentMode;
  selectedAlgorithms: string[];
  activeAlgorithmId: string | null;
  environment: Environment | null;
  robot: RobotPhysics | null;
  robotState: {
    pose: Pose;
    linearVelocity: number;
    angularVelocity: number;
    path: Pose[];
    lidarReadings: ReturnType<typeof simulateLidar>;
    status: string;
  } | null;
  plannedPath: Vec2[];
  actualPath: Pose[];
  openSet: { x: number; y: number }[];
  closedSet: { x: number; y: number }[];
  candidateTrajectories: { trajectory: Vec2[]; score: number; collides: boolean }[];
  selectedTrajectory: Vec2[];
  algorithmState: Record<string, unknown>;
  metrics: MetricsSnapshot;
  results: AlgorithmResult[];
  isRunning: boolean;
  isPaused: boolean;
  simTime: number;
  vizState: VisualizationState;
  collisionCount: number;
  replanCount: number;
  coverageWaypoints: Vec2[];
  currentWaypointIndex: number;
  coverageGrid: boolean[][];

  // Interactive Tools & Cleaning Mechanics
  currentTool: CanvasTool;
  batteryLevel: number;
  dirtTotalGrams: number;
  dirtCollectedGrams: number;
  suctionMode: SuctionMode;
  brushRotating: boolean;
  inspectCell: { gx: number; gy: number; occupied: boolean; dirt: number; cost: number } | null;

  // Actions
  setConfig: (config: Partial<SimulationConfig>) => void;
  setMode: (mode: ExperimentMode) => void;
  selectAlgorithm: (id: string, multi?: boolean) => void;
  initSimulation: () => void;
  runSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;
  setVizState: (state: Partial<VisualizationState>) => void;
  updateSimulation: (dt: number) => void;
  addResult: (result: AlgorithmResult) => void;
  clearResults: () => void;

  // Interactive Canvas Actions
  setTool: (tool: CanvasTool) => void;
  setGoalPosition: (pos: Vec2) => void;
  setRobotPosition: (pos: Vec2) => void;
  addCustomObstacle: (x: number, y: number, w?: number, h?: number) => void;
  addDirtPatch: (x: number, y: number, radius?: number) => void;
  eraseAt: (wx: number, wy: number) => void;
  setSuctionMode: (mode: SuctionMode) => void;
  setInspectCell: (cell: SimState['inspectCell']) => void;
}

const EMPTY_METRICS: MetricsSnapshot = {
  timestamp: 0, pathLength: 0, planningTime: 0, nodesExplored: 0, turns: 0,
  collisions: 0, goalDistance: 0, pathOptimality: 0, timeToGoal: 0,
  minObstacleDistance: Infinity, replanningCount: 0, velocitySmoothness: 0,
  positionError: 0, orientationError: 0, rmse: 0, maxError: 0, drift: 0,
  coveragePercentage: 0, uncoveredArea: 0, overlapPercentage: 0, revisits: 0,
  cleaningTime: 0, mapAccuracy: 0, trajectoryError: 0, mapCompletionTime: 0,
  minClearance: Infinity, predictionError: 0, replanTime: 0,
  dirtDetected: 0, dirtRemoved: 0, dirtReduction: 0, verificationConfidence: 0,
};

function createPlanner(id: string): PathPlanner | null {
  switch (id) {
    case 'astar': return new AStarPlanner();
    case 'dijkstra': return new DijkstraPlanner();
    case 'dstarlite': return new DStarLitePlanner();
    case 'rrt': return new RRTPlanner();
    case 'rrtstar': return new RRTStarPlanner();
    default: return null;
  }
}

export const useSimulationStore = create<SimState>((set, get) => ({
  config: DEFAULT_CONFIG,
  mode: 'path_planning',
  selectedAlgorithms: ['astar'],
  activeAlgorithmId: 'astar',
  environment: null,
  robot: null,
  robotState: null,
  plannedPath: [],
  actualPath: [],
  openSet: [],
  closedSet: [],
  candidateTrajectories: [],
  selectedTrajectory: [],
  algorithmState: {},
  metrics: { ...EMPTY_METRICS },
  results: [],
  isRunning: false,
  isPaused: false,
  simTime: 0,
  vizState: DEFAULT_VIZ,
  collisionCount: 0,
  replanCount: 0,
  coverageWaypoints: [],
  currentWaypointIndex: 0,
  coverageGrid: [],

  currentTool: 'inspect',
  batteryLevel: 100,
  dirtTotalGrams: 120,
  dirtCollectedGrams: 0,
  suctionMode: 'standard',
  brushRotating: false,
  inspectCell: null,

  setConfig: (config) => set(s => ({ config: { ...s.config, ...config } })),
  setMode: (mode) => set({ mode }),
  selectAlgorithm: (id, multi = false) => set(s => ({
    selectedAlgorithms: multi
      ? s.selectedAlgorithms.includes(id)
        ? s.selectedAlgorithms.filter(a => a !== id)
        : [...s.selectedAlgorithms, id]
      : [id],
    activeAlgorithmId: id,
  })),

  setTool: (tool) => set({ currentTool: tool }),
  setSuctionMode: (mode) => set({ suctionMode: mode }),
  setInspectCell: (inspectCell) => set({ inspectCell }),

  setGoalPosition: (pos) => {
    const { config, environment, selectedAlgorithms, mode } = get();
    const newConfig = { ...config, goalPosition: { x: pos.x, y: pos.y } };
    set({ config: newConfig });

    if (environment && ['path_planning', 'local_navigation', 'dynamic_obstacles', 'full_autonomous'].includes(mode)) {
      const algId = selectedAlgorithms[0] ?? 'astar';
      const planner = createPlanner(algId);
      if (planner) {
        planner.initialize(environment.grid, newConfig.startPose, newConfig.goalPosition);
        const result = planner.runFull();
        set({
          plannedPath: result.path,
          openSet: result.openSet,
          closedSet: result.closedSet,
          replanCount: get().replanCount + 1,
          metrics: {
            ...get().metrics,
            planningTime: result.planningTime,
            nodesExplored: result.nodesExplored,
            goalDistance: distance2(newConfig.startPose, newConfig.goalPosition),
          },
        });
      }
    }
  },

  setRobotPosition: (pos) => {
    const { config, environment, selectedAlgorithms, mode } = get();
    const newPose: Pose = { x: pos.x, y: pos.y, theta: config.startPose.theta };
    const newConfig = { ...config, startPose: newPose };
    const robot = createRobot(newPose);

    set({
      config: newConfig,
      robot,
      robotState: {
        pose: newPose,
        linearVelocity: 0,
        angularVelocity: 0,
        path: [newPose],
        lidarReadings: [],
        status: 'idle',
      },
      actualPath: [newPose],
      currentWaypointIndex: 0,
    });

    if (environment && ['path_planning', 'local_navigation', 'dynamic_obstacles', 'full_autonomous'].includes(mode)) {
      const algId = selectedAlgorithms[0] ?? 'astar';
      const planner = createPlanner(algId);
      if (planner) {
        planner.initialize(environment.grid, newPose, newConfig.goalPosition);
        const result = planner.runFull();
        set({
          plannedPath: result.path,
          openSet: result.openSet,
          closedSet: result.closedSet,
          metrics: {
            ...get().metrics,
            planningTime: result.planningTime,
            nodesExplored: result.nodesExplored,
          },
        });
      }
    }
  },

  addCustomObstacle: (x, y, w = 0.6, h = 0.6) => {
    const { environment, config, selectedAlgorithms, mode } = get();
    if (!environment) return;

    const newObs: Obstacle = {
      id: `custom-${Date.now()}`,
      x: Math.max(0.2, x - w / 2),
      y: Math.max(0.2, y - h / 2),
      width: w,
      height: h,
      type: 'furniture',
      label: 'Block',
    };

    const newWalls = [...environment.walls, newObs];
    // Mark on grid
    const grid = { ...environment.grid };
    const x0 = Math.floor(newObs.x / grid.resolution);
    const y0 = Math.floor(newObs.y / grid.resolution);
    const x1 = Math.ceil((newObs.x + newObs.width) / grid.resolution);
    const y1 = Math.ceil((newObs.y + newObs.height) / grid.resolution);
    for (let gy = y0; gy < y1; gy++) {
      for (let gx = x0; gx < x1; gx++) {
        if (isValidCell(gx, gy, grid)) {
          grid.cells[gy][gx].occupied = true;
        }
      }
    }

    set({
      environment: { ...environment, walls: newWalls, grid },
      replanCount: get().replanCount + 1,
    });

    // Re-plan
    const algId = selectedAlgorithms[0] ?? 'astar';
    const planner = createPlanner(algId);
    if (planner && ['path_planning', 'local_navigation', 'dynamic_obstacles', 'full_autonomous'].includes(mode)) {
      planner.initialize(grid, config.startPose, config.goalPosition);
      const result = planner.runFull();
      set({
        plannedPath: result.path,
        openSet: result.openSet,
        closedSet: result.closedSet,
      });
    }
  },

  addDirtPatch: (x, y, radius = 0.8) => {
    const { environment, config } = get();
    if (!environment) return;

    const newRegion: DirtRegion = { x, y, radius, intensity: 0.9 };
    const dirtRegions = [...environment.dirtRegions, newRegion];
    const grid = { ...environment.grid };
    const { gx, gy } = worldToGrid(x, y, grid);
    const gr = Math.ceil(radius / grid.resolution);

    for (let dy = -gr; dy <= gr; dy++) {
      for (let dx = -gr; dx <= gr; dx++) {
        const cx = gx + dx;
        const cy = gy + dy;
        if (!isValidCell(cx, cy, grid)) continue;
        const d = Math.sqrt(dx * dx + dy * dy) * grid.resolution;
        if (d <= radius) {
          grid.cells[cy][cx].dirtProbability = Math.min(1, grid.cells[cy][cx].dirtProbability + 0.8 * (1 - d / radius));
        }
      }
    }

    set({
      environment: { ...environment, dirtRegions, grid },
      dirtTotalGrams: get().dirtTotalGrams + 25,
    });
  },

  eraseAt: (wx, wy) => {
    const { environment, config, selectedAlgorithms, mode } = get();
    if (!environment) return;

    const radius = 0.8;
    // Remove furniture/custom obstacles within radius
    const walls = environment.walls.filter(w => {
      const cx = w.x + w.width / 2;
      const cy = w.y + w.height / 2;
      return Math.hypot(cx - wx, cy - wy) > radius || w.id.startsWith('w-'); // keep boundary walls
    });

    const furniture = environment.furniture.filter(f => {
      const cx = f.x + f.width / 2;
      const cy = f.y + f.height / 2;
      return Math.hypot(cx - wx, cy - wy) > radius;
    });

    const dirtRegions = environment.dirtRegions.filter(d => Math.hypot(d.x - wx, d.y - wy) > radius);

    // Clear grid cells
    const grid = { ...environment.grid };
    const { gx, gy } = worldToGrid(wx, wy, grid);
    const gr = Math.ceil(radius / grid.resolution);
    for (let dy = -gr; dy <= gr; dy++) {
      for (let dx = -gr; dx <= gr; dx++) {
        const cx = gx + dx;
        const cy = gy + dy;
        if (isValidCell(cx, cy, grid) && cx > 0 && cy > 0 && cx < grid.width - 1 && cy < grid.height - 1) {
          grid.cells[cy][cx].occupied = false;
          grid.cells[cy][cx].dirtProbability = 0;
        }
      }
    }

    set({
      environment: { ...environment, walls, furniture, dirtRegions, grid },
    });

    // Re-plan
    const algId = selectedAlgorithms[0] ?? 'astar';
    const planner = createPlanner(algId);
    if (planner && ['path_planning', 'local_navigation', 'dynamic_obstacles', 'full_autonomous'].includes(mode)) {
      planner.initialize(grid, config.startPose, config.goalPosition);
      const result = planner.runFull();
      set({
        plannedPath: result.path,
        openSet: result.openSet,
        closedSet: result.closedSet,
      });
    }
  },

  initSimulation: () => {
    const { config, selectedAlgorithms, mode } = get();
    const env = generateEnvironment(config);
    const robot = createRobot(config.startPose);

    let plannedPath: Vec2[] = [];
    let openSet: { x: number; y: number }[] = [];
    let closedSet: { x: number; y: number }[] = [];
    let coverageWaypoints: Vec2[] = [];
    let planningTime = 0;
    let nodesExplored = 0;
    const algorithmState: Record<string, unknown> = {};

    const algId = selectedAlgorithms[0] ?? 'astar';

    if (['path_planning', 'local_navigation', 'dynamic_obstacles', 'full_autonomous'].includes(mode)) {
      const planner = createPlanner(algId);
      if (planner) {
        planner.initialize(env.grid, config.startPose, config.goalPosition);
        const result = planner.runFull();
        plannedPath = result.path;
        openSet = result.openSet;
        closedSet = result.closedSet;
        planningTime = result.planningTime;
        nodesExplored = result.nodesExplored;
        algorithmState.plannerResult = result;
      }
    }

    if (mode === 'coverage') {
      const planner =
        algId === 'boustrophedon' ? new BoustrophedonPlanner() :
        algId === 'stc' ? new STCPlanner() :
        new LawnmowerPlanner();

      const result = planner.planWith ? planner.planWith(env.grid, config.startPose) : { waypoints: [], coveredCells: [], totalDistance: 0 };
      coverageWaypoints = result.waypoints;
      plannedPath = result.waypoints;
    }

    const coverageGrid = env.grid.cells.map(row => row.map(() => false));

    set({
      environment: env,
      robot,
      robotState: {
        pose: { ...config.startPose },
        linearVelocity: 0,
        angularVelocity: 0,
        path: [{ ...config.startPose }],
        lidarReadings: [],
        status: 'idle',
      },
      plannedPath,
      actualPath: [config.startPose],
      openSet,
      closedSet,
      algorithmState,
      coverageWaypoints,
      currentWaypointIndex: 0,
      coverageGrid,
      simTime: 0,
      collisionCount: 0,
      replanCount: 0,
      batteryLevel: 100,
      dirtTotalGrams: 125,
      dirtCollectedGrams: 0,
      brushRotating: false,
      metrics: {
        ...EMPTY_METRICS,
        planningTime,
        nodesExplored,
        goalDistance: distance2(config.startPose, config.goalPosition),
        timestamp: Date.now(),
      },
      isRunning: false,
      isPaused: false,
    });
  },

  updateSimulation: (dt: number) => {
    const { environment, robot, config, plannedPath, currentWaypointIndex,
            coverageWaypoints, mode, simTime, metrics, collisionCount, replanCount,
            actualPath, selectedAlgorithms, batteryLevel, dirtCollectedGrams, dirtTotalGrams, suctionMode } = get();
    if (!environment || !robot) return;

    const adjDt = dt * config.simulationSpeed;
    const algId = selectedAlgorithms[0] ?? 'dwa';

    let cmdLinear = 0, cmdAngular = 0;
    let newWaypointIndex = currentWaypointIndex;
    let candidateTrajectories: { trajectory: Vec2[]; score: number; collides: boolean }[] = [];
    let selectedTrajectory: Vec2[] = [];
    let status = 'navigating';

    // Battery check
    if (batteryLevel <= 0) {
      set({
        robotState: get().robotState ? { ...get().robotState!, status: 'battery_depleted', linearVelocity: 0, angularVelocity: 0 } : null,
        brushRotating: false,
        isRunning: false,
      });
      return;
    }

    const waypoints = mode === 'coverage' ? coverageWaypoints : plannedPath;
    const target = waypoints[newWaypointIndex];

    if (target) {
      const distToTarget = distance2(robot.pose, target);

      if (distToTarget < 0.35) {
        newWaypointIndex = Math.min(newWaypointIndex + 1, waypoints.length - 1);
      }

      if (newWaypointIndex >= waypoints.length - 1 && distToTarget < 0.3) {
        status = 'task_completed';
      }

      if (status !== 'task_completed') {
        const currentTarget = waypoints[newWaypointIndex];
        if (currentTarget) {
          if (['dwa', 'vfh'].includes(algId) || mode === 'local_navigation' || mode === 'dynamic_obstacles') {
            const plannerConfig: LocalPlannerConfig = {
              maxLinearVel: config.maxLinearVelocity,
              maxAngularVel: config.maxAngularVelocity,
              maxAccelLinear: config.maxAcceleration,
              maxAccelAngular: config.maxAcceleration * 2.2,
              dt: 0.1,
              horizonTime: 1.5,
              robotRadius: robot.radius,
            };

            const localPlanner = algId === 'vfh' ? new VFHPlanner() : new DWAPlanner();
            localPlanner.initialize(plannerConfig);
            const result = localPlanner.compute(robot.pose, currentTarget, environment);
            cmdLinear = result.cmdLinear;
            cmdAngular = result.cmdAngular;
            candidateTrajectories = result.candidateTrajectories.map(c => ({ trajectory: c.trajectory, score: c.score, collides: c.collides }));
            selectedTrajectory = result.selectedTrajectory;
          } else {
            // Pure pursuit / PID waypoint steering
            const angleToTarget = Math.atan2(currentTarget.y - robot.pose.y, currentTarget.x - robot.pose.x);
            const angleError = normalizeAngle(angleToTarget - robot.pose.theta);
            cmdAngular = Math.max(-config.maxAngularVelocity, Math.min(config.maxAngularVelocity, angleError * 3.2));
            cmdLinear = Math.abs(angleError) < 0.4 ? config.maxLinearVelocity * 0.85 : config.maxLinearVelocity * 0.25;
          }
        }
      }
    }

    const prevPose = { ...robot.pose };
    updateRobotPhysics(robot, cmdLinear, cmdAngular, adjDt, config, environment);

    // Collision check
    const moved = distance2(prevPose, robot.pose) < 0.0008 && (Math.abs(cmdLinear) > 0.02);
    const newCollisions = moved ? collisionCount + 1 : collisionCount;

    // Simulate LiDAR
    const lidarReadings = simulateLidar(robot.pose, config, environment);

    // Update coverage grid & absorb dirt
    const coverageGrid = get().coverageGrid;
    const gx = Math.floor(robot.pose.x / config.gridResolution);
    const gy = Math.floor(robot.pose.y / config.gridResolution);
    let newDirtCollected = dirtCollectedGrams;

    if (gx >= 0 && gx < environment.grid.width && gy >= 0 && gy < environment.grid.height) {
      const newCovGrid = coverageGrid.map(r => [...r]);
      const coverRadius = Math.ceil(robot.radius / config.gridResolution);
      const suctionMultiplier = suctionMode === 'boost' ? 1.6 : suctionMode === 'eco' ? 0.7 : 1.0;

      for (let dy = -coverRadius; dy <= coverRadius; dy++) {
        for (let dx = -coverRadius; dx <= coverRadius; dx++) {
          const cx = gx + dx, cy = gy + dy;
          if (cx >= 0 && cx < environment.grid.width && cy >= 0 && cy < environment.grid.height) {
            newCovGrid[cy][cx] = true;

            // Dirt absorption
            const cell = environment.grid.cells[cy][cx];
            if (cell.dirtProbability > 0.01) {
              const cleanedAmount = Math.min(cell.dirtProbability, 0.45 * adjDt * suctionMultiplier);
              cell.dirtProbability -= cleanedAmount;
              newDirtCollected += cleanedAmount * 8.5; // conversion factor to grams
            }
          }
        }
      }

      const totalCells = environment.grid.cells.flat().filter(c => !c.occupied).length;
      const coveredCells = newCovGrid.flat().filter(v => v).length;
      const coveragePct = totalCells > 0 ? (coveredCells / totalCells) * 100 : 0;

      // Update path length
      const newActualPath = [...actualPath, { ...robot.pose }];
      let pathLength = 0;
      for (let i = 1; i < newActualPath.length; i++) {
        pathLength += distance2(newActualPath[i - 1], newActualPath[i]);
      }

      const goalDist = distance2(robot.pose, config.goalPosition);

      // Battery drain
      const drainRate = (0.012 + (suctionMode === 'boost' ? 0.025 : suctionMode === 'eco' ? 0.007 : 0.015)) * (Math.abs(cmdLinear) > 0.01 ? 1.2 : 0.5);
      const newBattery = Math.max(0, batteryLevel - drainRate * adjDt);

      set({
        robot,
        currentWaypointIndex: newWaypointIndex,
        actualPath: newActualPath.slice(-600),
        coverageGrid: newCovGrid,
        candidateTrajectories,
        selectedTrajectory,
        collisionCount: newCollisions,
        simTime: simTime + adjDt,
        batteryLevel: newBattery,
        dirtCollectedGrams: newDirtCollected,
        brushRotating: Math.abs(cmdLinear) > 0.01 || Math.abs(cmdAngular) > 0.05,
        robotState: {
          pose: { ...robot.pose },
          linearVelocity: robot.linearVelocity,
          angularVelocity: robot.angularVelocity,
          path: newActualPath.slice(-60),
          lidarReadings,
          status,
        },
        metrics: {
          ...metrics,
          timestamp: Date.now(),
          pathLength,
          collisions: newCollisions,
          goalDistance: goalDist,
          coveragePercentage: coveragePct,
          timeToGoal: simTime + adjDt,
          dirtDetected: dirtTotalGrams,
          dirtRemoved: newDirtCollected,
          dirtReduction: dirtTotalGrams > 0 ? (newDirtCollected / dirtTotalGrams) * 100 : 0,
        },
      });
    }
  },

  runSimulation: () => set({ isRunning: true, isPaused: false, brushRotating: true }),
  pauseSimulation: () => set(s => ({ isPaused: !s.isPaused, isRunning: !s.isPaused ? true : false, brushRotating: !s.isPaused })),
  resetSimulation: () => {
    get().initSimulation();
  },
  stepSimulation: () => {
    const { updateSimulation } = get();
    updateSimulation(0.1);
  },

  setVizState: (vs) => set(s => ({ vizState: { ...s.vizState, ...vs } })),
  addResult: (result) => set(s => ({ results: [...s.results, result] })),
  clearResults: () => set({ results: [] }),
}));
