import { CoveragePlanner, CoveragePlannerResult } from '../interfaces';
import { Grid, Vec2 } from '../../simulation/core/types';
import { gridToWorld } from '../../simulation/environment/environment';
import { isValidCell } from '../../simulation/core/utils';
import { distance2 } from '../../simulation/core/utils';

// Boustrophedon (Lawn-mower) Coverage
export class BoustrophedonPlanner implements CoveragePlanner {
  readonly id = 'boustrophedon';
  readonly name = 'Boustrophedon (Lawn-Mower)';

  initialize(_grid: Grid, _start: Vec2): void {}

  plan(): CoveragePlannerResult {
    return this._plan(this._grid!, this._start!);
  }

  private _grid?: Grid;
  private _start?: Vec2;

  initializeWith(grid: Grid, start: Vec2): void {
    this._grid = grid;
    this._start = start;
  }

  planWith(grid: Grid, start: Vec2): CoveragePlannerResult {
    const waypoints: Vec2[] = [];
    const coveredCells: { x: number; y: number }[] = [];
    let totalDist = 0;

    // Scan the grid in boustrophedon pattern
    let goRight = true;
    for (let gy = 0; gy < grid.height; gy++) {
      const row: { x: number; y: number }[] = [];
      for (let gx = 0; gx < grid.width; gx++) {
        if (!grid.cells[gy][gx].occupied) {
          row.push({ x: gx, y: gy });
        }
      }
      if (!goRight) row.reverse();

      for (const cell of row) {
        const wp = gridToWorld(cell.x, cell.y, grid);
        if (waypoints.length > 0) {
          totalDist += distance2(waypoints[waypoints.length - 1], wp);
        }
        waypoints.push(wp);
        coveredCells.push(cell);
      }
      goRight = !goRight;
    }

    return { waypoints, coveredCells, totalDistance: totalDist };
  }

  _plan(grid: Grid, start: Vec2): CoveragePlannerResult {
    return this.planWith(grid, start);
  }

  reset(): void {}
}

// Spanning Tree Coverage
export class STCPlanner implements CoveragePlanner {
  readonly id = 'stc';
  readonly name = 'Spanning Tree Coverage (STC)';

  initialize(_grid: Grid, _start: Vec2): void {}

  plan(): CoveragePlannerResult {
    return { waypoints: [], coveredCells: [], totalDistance: 0 };
  }

  planWith(grid: Grid, start: Vec2): CoveragePlannerResult {
    // Build a spanning tree and traverse it
    const visited = new Set<string>();
    const waypoints: Vec2[] = [];
    const coveredCells: { x: number; y: number }[] = [];
    let totalDist = 0;

    const startGx = Math.floor(start.x / grid.resolution);
    const startGy = Math.floor(start.y / grid.resolution);

    const dfs = (gx: number, gy: number) => {
      const key = `${gx},${gy}`;
      if (visited.has(key)) return;
      if (!isValidCell(gx, gy, grid) || grid.cells[gy][gx].occupied) return;
      visited.add(key);

      const wp = gridToWorld(gx, gy, grid);
      if (waypoints.length > 0) totalDist += distance2(waypoints[waypoints.length - 1], wp);
      waypoints.push(wp);
      coveredCells.push({ x: gx, y: gy });

      // DFS in priority order (try to create snake-like pattern)
      const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
      for (const [dx, dy] of dirs) {
        dfs(gx + dx, gy + dy);
      }
    };

    dfs(startGx, startGy);
    return { waypoints, coveredCells, totalDistance: totalDist };
  }

  reset(): void {}
}

// Simple Lawnmower
export class LawnmowerPlanner implements CoveragePlanner {
  readonly id = 'lawnmower';
  readonly name = 'Lawnmower (Simple Row)';

  initialize(_grid: Grid, _start: Vec2): void {}

  plan(): CoveragePlannerResult {
    return { waypoints: [], coveredCells: [], totalDistance: 0 };
  }

  planWith(grid: Grid, start: Vec2): CoveragePlannerResult {
    const waypoints: Vec2[] = [];
    const coveredCells: { x: number; y: number }[] = [];
    let totalDist = 0;
    const step = 2; // skip every 2 rows for robot width

    for (let gy = 0; gy < grid.height; gy += step) {
      // Find row endpoints
      let rowStart = -1, rowEnd = -1;
      for (let gx = 0; gx < grid.width; gx++) {
        if (!grid.cells[gy][gx].occupied) {
          if (rowStart === -1) rowStart = gx;
          rowEnd = gx;
        }
      }
      if (rowStart === -1) continue;

      const leftWp = gridToWorld(rowStart, gy, grid);
      const rightWp = gridToWorld(rowEnd, gy, grid);

      const goRight = (gy / step) % 2 === 0;
      const from = goRight ? leftWp : rightWp;
      const to = goRight ? rightWp : leftWp;

      if (waypoints.length > 0) totalDist += distance2(waypoints[waypoints.length - 1], from);
      waypoints.push(from);
      totalDist += distance2(from, to);
      waypoints.push(to);

      for (let gx = rowStart; gx <= rowEnd; gx++) {
        if (!grid.cells[gy][gx].occupied) coveredCells.push({ x: gx, y: gy });
      }
    }

    return { waypoints, coveredCells, totalDistance: totalDist };
  }

  reset(): void {}
}
