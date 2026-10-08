import { PathPlanner, PathPlannerResult, AlgorithmState } from '../interfaces';
import { Grid, Vec2 } from '../../simulation/core/types';

interface RRTNode {
  x: number; y: number;
  parent: RRTNode | null;
  cost: number;
}

export class RRTPlanner implements PathPlanner {
  readonly id: string = 'rrt';
  readonly name: string = 'RRT';
  protected nodes: RRTNode[] = [];
  protected grid!: Grid;
  protected start!: Vec2;
  protected goal!: Vec2;
  protected result: PathPlannerResult | null = null;
  protected state: AlgorithmState = { running: false, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} };
  protected startTime = 0;
  protected maxIter = 5000;
  protected stepSize = 0.4; // meters
  protected goalBias = 0.1;
  protected goalRadius = 0.6;

  initialize(grid: Grid, start: Vec2, goal: Vec2): void {
    this.grid = grid;
    this.start = start;
    this.goal = goal;
    this.nodes = [{ x: start.x, y: start.y, parent: null, cost: 0 }];
    this.result = null;
    this.startTime = performance.now();
    this.state = { running: true, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} };
  }

  step(): boolean {
    this.runFull();
    return true;
  }

  runFull(): PathPlannerResult {
    const W = this.grid.width * this.grid.resolution;
    const H = this.grid.height * this.grid.resolution;

    for (let i = 0; i < this.maxIter; i++) {
      // Sample random point (with goal bias)
      let rx: number, ry: number;
      if (Math.random() < this.goalBias) {
        rx = this.goal.x; ry = this.goal.y;
      } else {
        rx = Math.random() * W;
        ry = Math.random() * H;
      }

      const nearest = this.nearestNode(rx, ry);
      const [nx, ny] = this.steer(nearest.x, nearest.y, rx, ry);

      if (!this.collides(nearest.x, nearest.y, nx, ny)) {
        const newNode: RRTNode = { x: nx, y: ny, parent: nearest, cost: nearest.cost + this.dist(nearest.x, nearest.y, nx, ny) };
        this.nodes.push(newNode);

        if (this.dist(nx, ny, this.goal.x, this.goal.y) < this.goalRadius) {
          const path = this.extractPath(newNode);
          this.result = { path, openSet: [], closedSet: this.nodes.map(n => ({ x: Math.floor(n.x / this.grid.resolution), y: Math.floor(n.y / this.grid.resolution) })), nodesExplored: this.nodes.length, planningTime: performance.now() - this.startTime, cost: newNode.cost };
          this.state.finished = true; this.state.success = true;
          return this.result;
        }
      }
    }

    this.result = { path: [], openSet: [], closedSet: this.nodes.map(n => ({ x: Math.floor(n.x / this.grid.resolution), y: Math.floor(n.y / this.grid.resolution) })), nodesExplored: this.nodes.length, planningTime: performance.now() - this.startTime, cost: Infinity };
    this.state.finished = true; this.state.success = false;
    return this.result;
  }

  protected nearestNode(x: number, y: number): RRTNode {
    let best = this.nodes[0];
    let bestDist = this.dist(x, y, best.x, best.y);
    for (const n of this.nodes) {
      const d = this.dist(x, y, n.x, n.y);
      if (d < bestDist) { bestDist = d; best = n; }
    }
    return best;
  }

  protected steer(fx: number, fy: number, tx: number, ty: number): [number, number] {
    const d = this.dist(fx, fy, tx, ty);
    if (d <= this.stepSize) return [tx, ty];
    const ratio = this.stepSize / d;
    return [fx + (tx - fx) * ratio, fy + (ty - fy) * ratio];
  }

  protected collides(x1: number, y1: number, x2: number, y2: number): boolean {
    const steps = Math.ceil(this.dist(x1, y1, x2, y2) / (this.grid.resolution * 0.5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const gx = Math.floor(x / this.grid.resolution);
      const gy = Math.floor(y / this.grid.resolution);
      if (gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height) return true;
      if (this.grid.cells[gy][gx].occupied) return true;
    }
    return false;
  }

  protected dist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  protected extractPath(node: RRTNode): Vec2[] {
    const path: Vec2[] = [];
    let current: RRTNode | null = node;
    while (current) { path.unshift({ x: current.x, y: current.y }); current = current.parent; }
    return path;
  }

  getResult(): PathPlannerResult { return this.result ?? { path: [], openSet: [], closedSet: [], nodesExplored: 0, planningTime: 0, cost: 0 }; }
  getState(): AlgorithmState { return this.state; }
  reset(): void { this.state = { running: false, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} }; this.result = null; this.nodes = []; }
}

export class RRTStarPlanner extends RRTPlanner {
  override readonly id = 'rrtstar';
  override readonly name = 'RRT*';
  private rewireRadius = 1.2;

  override runFull(): PathPlannerResult {
    const W = this.grid.width * this.grid.resolution;
    const H = this.grid.height * this.grid.resolution;

    for (let i = 0; i < this.maxIter; i++) {
      let rx: number, ry: number;
      if (Math.random() < this.goalBias) { rx = this.goal.x; ry = this.goal.y; }
      else { rx = Math.random() * W; ry = Math.random() * H; }

      const nearest = this.nearestNode(rx, ry);
      const [nx, ny] = this.steer(nearest.x, nearest.y, rx, ry);
      if (this.collides(nearest.x, nearest.y, nx, ny)) continue;

      // Find near nodes for RRT* rewiring
      const near = this.nodes.filter(n => this.dist(n.x, n.y, nx, ny) < this.rewireRadius);

      // Choose best parent
      let bestParent = nearest;
      let bestCost = nearest.cost + this.dist(nearest.x, nearest.y, nx, ny);
      for (const n of near) {
        const c = n.cost + this.dist(n.x, n.y, nx, ny);
        if (c < bestCost && !this.collides(n.x, n.y, nx, ny)) { bestCost = c; bestParent = n; }
      }

      const newNode: RRTNode = { x: nx, y: ny, parent: bestParent, cost: bestCost };
      this.nodes.push(newNode);

      // Rewire
      for (const n of near) {
        const c = newNode.cost + this.dist(newNode.x, newNode.y, n.x, n.y);
        if (c < n.cost && !this.collides(newNode.x, newNode.y, n.x, n.y)) {
          n.parent = newNode;
          n.cost = c;
        }
      }

      if (this.dist(nx, ny, this.goal.x, this.goal.y) < this.goalRadius) {
        const path = this.extractPath(newNode);
        this.result = { path, openSet: [], closedSet: this.nodes.map(n => ({ x: Math.floor(n.x / this.grid.resolution), y: Math.floor(n.y / this.grid.resolution) })), nodesExplored: this.nodes.length, planningTime: performance.now() - this.startTime, cost: newNode.cost };
        this.state.finished = true; this.state.success = true;
        return this.result;
      }
    }

    this.result = { path: [], openSet: [], closedSet: this.nodes.map(n => ({ x: Math.floor(n.x / this.grid.resolution), y: Math.floor(n.y / this.grid.resolution) })), nodesExplored: this.nodes.length, planningTime: performance.now() - this.startTime, cost: Infinity };
    this.state.finished = true;
    return this.result;
  }
}
