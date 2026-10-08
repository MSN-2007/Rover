import { PathPlanner, PathPlannerResult, AlgorithmState } from '../interfaces';
import { Grid, Vec2 } from '../../simulation/core/types';
import { PriorityQueue } from '../../simulation/core/utils';

export class DijkstraPlanner implements PathPlanner {
  readonly id = 'dijkstra';
  readonly name = 'Dijkstra';

  private grid!: Grid;
  private start!: Vec2;
  private goal!: Vec2;
  private openList!: PriorityQueue<{ gx: number; gy: number; g: number; parent: { gx: number; gy: number } | null }>;
  private closedSet!: Set<string>;
  private closedNodes!: { x: number; y: number }[];
  private nodeMap!: Map<string, { gx: number; gy: number; g: number; parent: { gx: number; gy: number } | null }>;
  private result: PathPlannerResult | null = null;
  private state: AlgorithmState = { running: false, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} };
  private startTime = 0;

  initialize(grid: Grid, start: Vec2, goal: Vec2): void {
    this.grid = grid;
    this.start = start;
    this.goal = goal;
    this.openList = new PriorityQueue();
    this.closedSet = new Set();
    this.closedNodes = [];
    this.nodeMap = new Map();
    this.result = null;
    this.startTime = performance.now();

    const startGx = Math.floor(start.x / grid.resolution);
    const startGy = Math.floor(start.y / grid.resolution);
    const goalGx = Math.floor(goal.x / grid.resolution);
    const goalGy = Math.floor(goal.y / grid.resolution);

    const startNode = { gx: startGx, gy: startGy, g: 0, parent: null };
    this.openList.push(startNode, 0);
    this.nodeMap.set(`${startGx},${startGy}`, startNode);
    this.state = { running: true, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: { goalGx, goalGy } };
  }

  step(): boolean {
    if (this.state.finished || this.openList.isEmpty) {
      this.state.finished = true;
      return true;
    }
    const current = this.openList.pop()!;
    const key = `${current.gx},${current.gy}`;
    if (this.closedSet.has(key)) return false;
    this.closedSet.add(key);
    this.closedNodes.push({ x: current.gx, y: current.gy });

    const { goalGx, goalGy } = this.state.internalData as { goalGx: number; goalGy: number };
    if (current.gx === goalGx && current.gy === goalGy) {
      this.buildResult(current);
      return true;
    }

    const dirs = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]];
    for (const [dx, dy, cost] of dirs) {
      const nx = current.gx + dx, ny = current.gy + dy;
      if (nx < 0 || nx >= this.grid.width || ny < 0 || ny >= this.grid.height) continue;
      if (this.grid.cells[ny][nx].occupied) continue;
      const nkey = `${nx},${ny}`;
      if (this.closedSet.has(nkey)) continue;
      const g = current.g + cost;
      const existing = this.nodeMap.get(nkey);
      if (!existing || g < existing.g) {
        const node = { gx: nx, gy: ny, g, parent: { gx: current.gx, gy: current.gy } };
        this.nodeMap.set(nkey, node);
        this.openList.push(node, g);
      }
    }
    this.state.stepCount++;
    return false;
  }

  private buildResult(goalNode: { gx: number; gy: number; g: number; parent: { gx: number; gy: number } | null }): void {
    const path: Vec2[] = [];
    let current: { gx: number; gy: number } | null = { gx: goalNode.gx, gy: goalNode.gy };
    while (current) {
      path.unshift({ x: current.gx * this.grid.resolution + this.grid.resolution / 2, y: current.gy * this.grid.resolution + this.grid.resolution / 2 });
      const node = this.nodeMap.get(`${current.gx},${current.gy}`);
      current = node?.parent ?? null;
    }
    this.result = { path, openSet: [], closedSet: this.closedNodes, nodesExplored: this.closedSet.size, planningTime: performance.now() - this.startTime, cost: goalNode.g };
    this.state.finished = true;
    this.state.success = true;
  }

  getResult(): PathPlannerResult { return this.result ?? { path: [], openSet: [], closedSet: [], nodesExplored: 0, planningTime: 0, cost: 0 }; }
  getState(): AlgorithmState { return this.state; }
  reset(): void { this.state = { running: false, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} }; this.result = null; }
  runFull(): PathPlannerResult { while (!this.step()) {} return this.getResult(); }
}
