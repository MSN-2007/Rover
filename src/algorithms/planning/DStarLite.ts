import { PathPlanner, PathPlannerResult, AlgorithmState } from '../interfaces';
import { Grid, Vec2 } from '../../simulation/core/types';
import { PriorityQueue, heuristic } from '../../simulation/core/utils';

// D* Lite - Koenig & Likhachev 2002
// Incremental planning algorithm that replans when obstacles discovered
interface DLNode {
  gx: number; gy: number;
  g: number; rhs: number;
}

export class DStarLitePlanner implements PathPlanner {
  readonly id = 'dstarlite';
  readonly name = 'D* Lite';

  private grid!: Grid;
  private start!: Vec2;
  private goal!: Vec2;
  private goalGx = 0; private goalGy = 0;
  private startGx = 0; private startGy = 0;
  private nodes!: Map<string, DLNode>;
  private U!: PriorityQueue<DLNode>;
  private km = 0;
  private result: PathPlannerResult | null = null;
  private state: AlgorithmState = { running: false, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} };
  private startTime = 0;
  private closedNodes: { x: number; y: number }[] = [];

  private key(node: DLNode): [number, number] {
    const h = heuristic(this.startGx, this.startGy, node.gx, node.gy, 'octile');
    return [Math.min(node.g, node.rhs) + h + this.km, Math.min(node.g, node.rhs)];
  }

  private keyStr(k: [number, number]): number { return k[0] * 1e9 + k[1]; }

  private getNode(gx: number, gy: number): DLNode {
    const k = `${gx},${gy}`;
    if (!this.nodes.has(k)) this.nodes.set(k, { gx, gy, g: Infinity, rhs: Infinity });
    return this.nodes.get(k)!;
  }

  initialize(grid: Grid, start: Vec2, goal: Vec2): void {
    this.grid = grid;
    this.start = start;
    this.goal = goal;
    this.goalGx = Math.floor(goal.x / grid.resolution);
    this.goalGy = Math.floor(goal.y / grid.resolution);
    this.startGx = Math.floor(start.x / grid.resolution);
    this.startGy = Math.floor(start.y / grid.resolution);
    this.nodes = new Map();
    this.U = new PriorityQueue();
    this.km = 0;
    this.closedNodes = [];
    this.result = null;
    this.startTime = performance.now();

    const goalNode = this.getNode(this.goalGx, this.goalGy);
    goalNode.rhs = 0;
    const k = this.key(goalNode);
    this.U.push(goalNode, this.keyStr(k));

    this.state = { running: true, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} };
  }

  step(): boolean {
    // Run full computation (D* Lite is typically run to completion then path extracted)
    this.computeShortestPath();
    this.extractPath();
    return true;
  }

  private computeShortestPath(): void {
    const startNode = this.getNode(this.startGx, this.startGy);
    let iters = 0;
    while (!this.U.isEmpty && iters < 50000) {
      iters++;
      const u = this.U.pop()!;
      this.closedNodes.push({ x: u.gx, y: u.gy });

      const ku = this.key(u);
      const ks = this.key(startNode);
      if (this.keyStr(ku) >= this.keyStr(ks) && startNode.rhs === startNode.g) break;

      if (u.g > u.rhs) {
        u.g = u.rhs;
        for (const [nx, ny] of this.neighbors(u.gx, u.gy)) {
          this.updateVertex(this.getNode(nx, ny));
        }
      } else {
        u.g = Infinity;
        this.updateVertex(u);
        for (const [nx, ny] of this.neighbors(u.gx, u.gy)) {
          this.updateVertex(this.getNode(nx, ny));
        }
      }
    }
  }

  private updateVertex(u: DLNode): void {
    if (u.gx !== this.goalGx || u.gy !== this.goalGy) {
      let minRhs = Infinity;
      for (const [nx, ny] of this.neighbors(u.gx, u.gy)) {
        const n = this.getNode(nx, ny);
        const cost = this.grid.cells[ny]?.[nx]?.occupied ? Infinity : Math.sqrt((nx - u.gx) ** 2 + (ny - u.gy) ** 2);
        minRhs = Math.min(minRhs, n.g + cost);
      }
      u.rhs = minRhs;
    }
    if (u.g !== u.rhs) {
      const k = this.key(u);
      this.U.push(u, this.keyStr(k));
    }
  }

  private neighbors(gx: number, gy: number): [number, number][] {
    const result: [number, number][] = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dx, dy] of dirs) {
      const nx = gx + dx, ny = gy + dy;
      if (nx >= 0 && nx < this.grid.width && ny >= 0 && ny < this.grid.height) {
        result.push([nx, ny]);
      }
    }
    return result;
  }

  private extractPath(): void {
    const path: Vec2[] = [];
    let cx = this.startGx, cy = this.startGy;
    const visited = new Set<string>();
    while ((cx !== this.goalGx || cy !== this.goalGy) && path.length < 10000) {
      const k = `${cx},${cy}`;
      if (visited.has(k)) break;
      visited.add(k);
      path.push({ x: cx * this.grid.resolution + this.grid.resolution / 2, y: cy * this.grid.resolution + this.grid.resolution / 2 });
      let bestG = Infinity, bestNx = cx, bestNy = cy;
      for (const [nx, ny] of this.neighbors(cx, cy)) {
        if (this.grid.cells[ny]?.[nx]?.occupied) continue;
        const n = this.getNode(nx, ny);
        if (n.g < bestG) { bestG = n.g; bestNx = nx; bestNy = ny; }
      }
      if (bestNx === cx && bestNy === cy) break;
      cx = bestNx; cy = bestNy;
    }
    path.push({ x: this.goalGx * this.grid.resolution + this.grid.resolution / 2, y: this.goalGy * this.grid.resolution + this.grid.resolution / 2 });
    const startNode = this.getNode(this.startGx, this.startGy);
    this.result = { path, openSet: [], closedSet: this.closedNodes, nodesExplored: this.closedNodes.length, planningTime: performance.now() - this.startTime, cost: startNode.g };
    this.state.finished = true;
    this.state.success = path.length > 1;
  }

  getResult(): PathPlannerResult { return this.result ?? { path: [], openSet: [], closedSet: [], nodesExplored: 0, planningTime: 0, cost: 0 }; }
  getState(): AlgorithmState { return this.state; }
  reset(): void { this.state = { running: false, finished: false, success: false, stepCount: 0, elapsedTime: 0, internalData: {} }; this.result = null; }
  runFull(): PathPlannerResult { this.step(); return this.getResult(); }
}
