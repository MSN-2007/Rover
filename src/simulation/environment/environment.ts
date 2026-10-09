import { Environment, Grid, GridCell, Obstacle, DirtRegion, DynamicObstacle, SimulationConfig, Vec2, Room } from '../core/types';
import { createRNG, RNG } from '../core/utils';

export function createGrid(width: number, height: number, resolution: number): Grid {
  const cols = Math.ceil(width / resolution);
  const rows = Math.ceil(height / resolution);
  const cells: GridCell[][] = [];
  for (let y = 0; y < rows; y++) {
    cells[y] = [];
    for (let x = 0; x < cols; x++) {
      cells[y][x] = {
        x, y,
        occupied: false,
        explored: false,
        covered: false,
        dirtProbability: 0,
        dirtAfter: 0,
        passes: 0,
        cost: 1,
      };
    }
  }
  return { width: cols, height: rows, resolution, cells, originX: 0, originY: 0 };
}

export function worldToGrid(wx: number, wy: number, grid: Grid): { gx: number; gy: number } {
  return {
    gx: Math.floor((wx - grid.originX) / grid.resolution),
    gy: Math.floor((wy - grid.originY) / grid.resolution),
  };
}

export function gridToWorld(gx: number, gy: number, grid: Grid): Vec2 {
  return {
    x: gx * grid.resolution + grid.originX + grid.resolution / 2,
    y: gy * grid.resolution + grid.originY + grid.resolution / 2,
  };
}

export function isValidCell(gx: number, gy: number, grid: Grid): boolean {
  return gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height;
}

export function markObstaclesOnGrid(grid: Grid, obstacles: Obstacle[], resolution: number): void {
  for (const obs of obstacles) {
    const x0 = Math.floor(obs.x / resolution);
    const y0 = Math.floor(obs.y / resolution);
    const x1 = Math.ceil((obs.x + obs.width) / resolution);
    const y1 = Math.ceil((obs.y + obs.height) / resolution);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (isValidCell(x, y, grid)) {
          grid.cells[y][x].occupied = true;
        }
      }
    }
  }
}

/**
 * Inflate obstacles on the grid by robot radius so that path planners
 * (A*, Dijkstra, etc.) never route the robot through narrow passages
 * that would cause it to physically collide with obstacles.
 * 
 * @param grid - The occupancy grid to inflate in-place
 * @param robotRadius - Physical radius of the robot in world units (meters)
 */
export function inflateObstacles(grid: Grid, robotRadius: number): void {
  const inflateRadius = Math.ceil(robotRadius / grid.resolution); // cells to inflate
  const original = grid.cells.map(row => row.map(cell => cell.occupied));

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (original[y][x]) {
        // Inflate in a circle of inflateRadius cells
        for (let dy = -inflateRadius; dy <= inflateRadius; dy++) {
          for (let dx = -inflateRadius; dx <= inflateRadius; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= inflateRadius) {
              const nx = x + dx;
              const ny = y + dy;
              if (isValidCell(nx, ny, grid)) {
                grid.cells[ny][nx].occupied = true;
              }
            }
          }
        }
      }
    }
  }
}

export function generateEnvironment(config: SimulationConfig): Environment {
  const rng = createRNG(config.randomSeed);

  const grid = createGrid(config.mapWidth, config.mapHeight, config.gridResolution);
  const walls: Obstacle[] = [];
  const furniture: Obstacle[] = [];
  const dynamicObstacles: DynamicObstacle[] = [];
  const dirtRegions: DirtRegion[] = [];
  const rooms: Room[] = [];

  const thickness = 0.2; // wall thickness in meters

  // Boundary walls
  walls.push(
    { id: 'w-top', x: 0, y: 0, width: config.mapWidth, height: thickness, type: 'wall' },
    { id: 'w-bottom', x: 0, y: config.mapHeight - thickness, width: config.mapWidth, height: thickness, type: 'wall' },
    { id: 'w-left', x: 0, y: 0, width: thickness, height: config.mapHeight, type: 'wall' },
    { id: 'w-right', x: config.mapWidth - thickness, y: 0, width: thickness, height: config.mapHeight, type: 'wall' },
  );

  switch (config.mapType) {
    case 'multi_room':
      generateMultiRoom(walls, rooms, config, rng, furniture);
      break;
    case 'furniture':
      generateFurnitureRoom(furniture, rooms, config, rng);
      break;
    case 'corridor':
      generateCorridor(walls, rooms, config, rng);
      break;
    case 'random':
      generateRandom(walls, furniture, config, rng);
      break;
    case 'empty':
    default:
      rooms.push({ id: 'main', x: 0, y: 0, width: config.mapWidth, height: config.mapHeight, label: 'Main Room' });
      break;
  }

  // Add dynamic obstacles
  for (let i = 0; i < config.dynamicObstacleCount; i++) {
    const obs = generateDynamicObstacle(i, config, rng, walls);
    dynamicObstacles.push(obs);
  }

  // Generate dirt regions
  const dirtCount = 3 + Math.floor(rng.next() * 5);
  for (let i = 0; i < dirtCount; i++) {
    dirtRegions.push({
      x: rng.nextRange(1, config.mapWidth - 1),
      y: rng.nextRange(1, config.mapHeight - 1),
      radius: rng.nextRange(0.3, 1.2),
      intensity: rng.nextRange(0.3, 1.0),
    });
  }

  // Mark obstacles on grid, then inflate by robot radius for safe path planning
  markObstaclesOnGrid(grid, walls, config.gridResolution);
  markObstaclesOnGrid(grid, furniture, config.gridResolution);
  // Robot radius is 0.25m — inflate so A* stays clear of obstacles
  inflateObstacles(grid, 0.28);

  // Apply dirt to grid cells
  for (const dr of dirtRegions) {
    const { gx, gy } = worldToGrid(dr.x, dr.y, grid);
    const gr = Math.ceil(dr.radius / config.gridResolution);
    for (let dy = -gr; dy <= gr; dy++) {
      for (let dx = -gr; dx <= gr; dx++) {
        const cx = gx + dx;
        const cy = gy + dy;
        if (!isValidCell(cx, cy, grid)) continue;
        const d = Math.sqrt(dx * dx + dy * dy) * config.gridResolution;
        if (d <= dr.radius) {
          const cell = grid.cells[cy][cx];
          cell.dirtProbability = Math.min(1, cell.dirtProbability + dr.intensity * (1 - d / dr.radius));
        }
      }
    }
  }

  return { width: config.mapWidth, height: config.mapHeight, walls, furniture, dynamicObstacles, dirtRegions, rooms, grid };
}

function generateMultiRoom(walls: Obstacle[], rooms: Room[], config: SimulationConfig, rng: RNG, furniture: Obstacle[]): void {
  const W = config.mapWidth;
  const H = config.mapHeight;
  // Horizontal divider
  const divY = H * rng.nextRange(0.35, 0.65);
  const door1x = rng.nextRange(1, W - 3);
  walls.push({ id: 'hdiv', x: 0, y: divY, width: door1x, height: 0.2, type: 'wall' });
  walls.push({ id: 'hdiv2', x: door1x + 1.5, y: divY, width: W - door1x - 1.5, height: 0.2, type: 'wall' });

  // Vertical divider in top
  const divX = W * rng.nextRange(0.35, 0.65);
  const door2y = rng.nextRange(0.5, divY - 1.5);
  walls.push({ id: 'vdiv-a', x: divX, y: 0, width: 0.2, height: door2y, type: 'wall' });
  walls.push({ id: 'vdiv-b', x: divX, y: door2y + 1.2, width: 0.2, height: divY - door2y - 1.2, type: 'wall' });

  rooms.push(
    { id: 'r1', x: 0, y: 0, width: divX, height: divY, label: 'Living Room' },
    { id: 'r2', x: divX, y: 0, width: W - divX, height: divY, label: 'Bedroom' },
    { id: 'r3', x: 0, y: divY, width: W / 2, height: H - divY, label: 'Kitchen' },
    { id: 'r4', x: W / 2, y: divY, width: W / 2, height: H - divY, label: 'Bathroom' },
  );

  // Add some furniture
  addFurniture(furniture, rooms, rng);
}

function generateFurnitureRoom(furniture: Obstacle[], rooms: Room[], config: SimulationConfig, rng: RNG): void {
  rooms.push({ id: 'main', x: 0, y: 0, width: config.mapWidth, height: config.mapHeight, label: 'Living Room' });
  addFurniture(furniture, rooms, rng);
}

function addFurniture(furniture: Obstacle[], rooms: Room[], rng: RNG): void {
  const items = [
    { label: 'Sofa', w: 2.0, h: 0.8 },
    { label: 'Table', w: 1.2, h: 0.8 },
    { label: 'Chair', w: 0.6, h: 0.6 },
    { label: 'Bed', w: 1.8, h: 1.4 },
    { label: 'Wardrobe', w: 1.2, h: 0.5 },
    { label: 'Desk', w: 1.0, h: 0.6 },
  ];

  for (const room of rooms) {
    const count = rng.nextInt(1, 3);
    for (let i = 0; i < count; i++) {
      const item = items[rng.nextInt(0, items.length - 1)];
      const margin = 0.3;
      const fx = room.x + margin + rng.next() * (room.width - item.w - margin * 2);
      const fy = room.y + margin + rng.next() * (room.height - item.h - margin * 2);
      furniture.push({
        id: `furn-${furniture.length}`,
        x: fx, y: fy,
        width: item.w, height: item.h,
        type: 'furniture',
        label: item.label,
      });
    }
  }
}

function generateCorridor(walls: Obstacle[], rooms: Room[], config: SimulationConfig, rng: RNG): void {
  const W = config.mapWidth;
  const H = config.mapHeight;
  // Main corridor down the middle
  const cY = H * 0.4;
  const cH = H * 0.2;
  // Walls above and below corridor with rooms branching off
  walls.push({ id: 'c-top', x: 0, y: cY, width: W, height: 0.2, type: 'wall' });
  walls.push({ id: 'c-bot', x: 0, y: cY + cH, width: W, height: 0.2, type: 'wall' });

  rooms.push({ id: 'corridor', x: 0, y: cY, width: W, height: cH, label: 'Corridor' });

  // Branch rooms
  const nRooms = rng.nextInt(2, 4);
  for (let i = 0; i < nRooms; i++) {
    const rx = (i + 0.5) * (W / nRooms);
    const doorW = 1.0;
    walls.push({ id: `rc-${i}a`, x: rx - 2, y: cY, width: 2 - doorW / 2, height: 0.2, type: 'wall' });
    rooms.push({ id: `r-${i}`, x: rx - 2, y: 0, width: 4, height: cY, label: `Room ${i + 1}` });
  }
}

function generateRandom(walls: Obstacle[], furniture: Obstacle[], config: SimulationConfig, rng: RNG): void {
  const count = config.obstacleCount;
  for (let i = 0; i < count; i++) {
    const w = rng.nextRange(0.5, 1.5);
    const h = rng.nextRange(0.5, 1.5);
    const x = rng.nextRange(1, config.mapWidth - w - 1);
    const y = rng.nextRange(1, config.mapHeight - h - 1);
    // Don't place near start
    const sx = config.startPose.x;
    const sy = config.startPose.y;
    if (Math.abs(x - sx) < 2 && Math.abs(y - sy) < 2) continue;
    furniture.push({ id: `obs-${i}`, x, y, width: w, height: h, type: 'furniture', label: 'Obstacle' });
  }
}

function generateDynamicObstacle(id: number, config: SimulationConfig, rng: RNG, walls: Obstacle[]): DynamicObstacle {
  const speed = rng.nextRange(0.3, 0.8);
  const x = rng.nextRange(1, config.mapWidth - 1);
  const y = rng.nextRange(1, config.mapHeight - 1);

  // Generate a random patrol path
  const pathLength = rng.nextInt(3, 6);
  const path: Vec2[] = [];
  for (let i = 0; i < pathLength; i++) {
    path.push({
      x: rng.nextRange(1, config.mapWidth - 1),
      y: rng.nextRange(1, config.mapHeight - 1),
    });
  }

  return {
    id: `dyn-${id}`,
    x, y,
    width: 0.4, height: 0.4,
    type: 'dynamic',
    label: id % 2 === 0 ? 'Person' : 'Pet',
    velocity: { x: speed, y: 0 },
    path,
    pathIndex: 0,
    predictedPositions: [],
  };
}

export function updateDynamicObstacles(env: Environment, dt: number): void {
  for (const dyn of env.dynamicObstacles) {
    if (dyn.path.length === 0) continue;

    const target = dyn.path[dyn.pathIndex];
    const dx = target.x - dyn.x;
    const dy = target.y - dyn.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.sqrt(dyn.velocity.x * dyn.velocity.x + dyn.velocity.y * dyn.velocity.y);

    if (dist < 0.1) {
      dyn.pathIndex = (dyn.pathIndex + 1) % dyn.path.length;
    } else {
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      dyn.x += vx * dt;
      dyn.y += vy * dt;
      dyn.velocity = { x: vx, y: vy };
    }

    // Predict future positions (2 seconds ahead)
    dyn.predictedPositions = [];
    let px = dyn.x;
    let py = dyn.y;
    let pidx = dyn.pathIndex;
    for (let t = 0; t < 2; t += 0.2) {
      const ptarget = dyn.path[pidx];
      const pdx = ptarget.x - px;
      const pdy = ptarget.y - py;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pdist > 0.1) {
        px += (pdx / pdist) * speed * 0.2;
        py += (pdy / pdist) * speed * 0.2;
      } else {
        pidx = (pidx + 1) % dyn.path.length;
      }
      dyn.predictedPositions.push({ x: px, y: py });
    }
  }
}
