import { PathPlanner, PathPlannerResult, AlgorithmState } from '../interfaces';
import { Grid, Vec2 } from '../../simulation/core/types';
import { PriorityQueue, heuristic, isValidCell as validCell } from '../../simulation/core/utils';

interface Node {
  gx: number; gy: number;
  g: number; h: number; f: number;
  parent: Node | null;
}

export class AStarPlanner implements PathPlanner {
  readonly id = 'astar';
  readonly name = 'A*';

  private grid!: Grid;
  private start!: Vec2;
  private goal!: Vec2;
  private openList!: PriorityQueue<Node>;
  private openSet!: Set<string>;
  private closedSet!: Set<string>;
  private closedNodes!: { x: number; y: number }[];
  private openNodes!: { x: number; y: number }[];
  private nodeMap!: Map<string, Node>;
  private result: PathPlannerResult | null = null;
  private state: AlgorithmState = { running: false, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} };
  private startTime = 0;

  initialize(grid: Grid, start: Vec2, goal: Vec2): void {
    this.grid = grid;
    this.start = start;
    this.goal = goal;
    this.openList = new PriorityQueue<Node>();
    this.openSet = new Set();
    this.closedSet = new Set();
    this.closedNodes = [];
    this.openNodes = [];
    this.nodeMap = new Map();
    this.result = null;
    this.startTime = performance.now();

    const startGx = Math.floor(start.x / grid.resolution);
    const startGy = Math.floor(start.y / grid.resolution);
    const goalGx = Math.floor(goal.x / grid.resolution);
    const goalGy = Math.floor(goal.y / grid.resolution);

    const h = heuristic(startGx, startGy, goalGx, goalGy, 'octile');
    const startNode: Node = { gx: startGx, gy: startGy, g: 0, h, f: h, parent: null };
    const key = `${startGx},${startGy}`;
    this.openList.push(startNode, h);
    this.openSet.add(key);
    this.nodeMap.set(key, startNode);

    this.state = { running: true, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: { current: null, goalGx, goalGy } };
  }

  step(): boolean {
    if (this.state.finished || this.openList.isEmpty) {
      this.state.finished = true;
      this.state.success = false;
      return true;
    }

    const current = this.openList.pop()!;
    const key = `${current.gx},${current.gy}`;
    this.openSet.delete(key);
    this.closedSet.add(key);
    this.closedNodes.push({ x: current.gx, y: current.gy });

    const { goalGx, goalGy } = this.state.internalData as { goalGx: number; goalGy: number };

    this.state.internalData = {
      ...this.state.internalData,
      current: { gx: current.gx, gy: current.gy, g: current.g, h: current.h, f: current.f },
    };

    if (current.gx === goalGx && current.gy === goalGy) {
      this.buildResult(current);
      return true;
    }

    // 8-directional neighbors
    const dirs = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
    ];

    for (const [dx, dy, cost] of dirs) {
      const nx = current.gx + dx;
      const ny = current.gy + dy;
      if (!validCell(nx, ny, this.grid)) continue;
      if (this.grid.cells[ny][nx].occupied) continue;

      const nkey = `${nx},${ny}`;
      if (this.closedSet.has(nkey)) continue;

      const g = current.g + cost;
      const h = heuristic(nx, ny, goalGx, goalGy, 'octile');
      const f = g + h;

      if (this.openSet.has(nkey)) {
        const existing = this.nodeMap.get(nkey)!;
        if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
          this.openList.push(existing, f);
        }
      } else {
        const node: Node = { gx: nx, gy: ny, g, h, f, parent: current };
        this.nodeMap.set(nkey, node);
        this.openList.push(node, f);
        this.openSet.add(nkey);
        this.openNodes.push({ x: nx, y: ny });
      }
    }

    this.state.stepCount++;
    this.state.elapsedTime = performance.now() - this.startTime;
    return false;
  }

  private buildResult(goalNode: Node): void {
    const path: Vec2[] = [];
    let node: Node | null = goalNode;
    while (node) {
      path.unshift({
        x: node.gx * this.grid.resolution + this.grid.resolution / 2,
        y: node.gy * this.grid.resolution + this.grid.resolution / 2,
      });
      node = node.parent;
    }
    this.result = {
      path,
      openSet: this.openNodes,
      closedSet: this.closedNodes,
      nodesExplored: this.closedSet.size,
      planningTime: performance.now() - this.startTime,
      cost: goalNode.g,
    };
    this.state.finished = true;
    this.state.success = true;
  }

  getResult(): PathPlannerResult {
    return this.result ?? { path: [], openSet: [], closedSet: [], nodesExplored: this.closedSet.size, planningTime: performance.now() - this.startTime, cost: 0 };
  }

  getState(): AlgorithmState {
    return this.state;
  }

  reset(): void {
    this.state = { running: false, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} };
    this.result = null;
  }

  runFull(): PathPlannerResult {
    while (!this.step()) { /* run to completion */ }
    return this.getResult();
  }
}
