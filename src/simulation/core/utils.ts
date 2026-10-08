// Seeded pseudo-random number generator (Mulberry32)
export function createRNG(seed: number) {
  let s = seed >>> 0;
  return {
    next(): number {
      s += 0x6d2b79f5;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    nextRange(min: number, max: number): number {
      return min + this.next() * (max - min);
    },
    nextInt(min: number, max: number): number {
      return Math.floor(this.nextRange(min, max + 1));
    },
    nextGaussian(): number {
      // Box-Muller transform
      const u1 = this.next();
      const u2 = this.next();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    },
  };
}

export type RNG = ReturnType<typeof createRNG>;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distance2(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return distance(p1.x, p1.y, p2.x, p2.y);
}

export function angleTo(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function heuristic(x1: number, y1: number, x2: number, y2: number, type: 'euclidean' | 'manhattan' | 'octile' = 'euclidean'): number {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  switch (type) {
    case 'manhattan': return dx + dy;
    case 'octile': return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    default: return Math.sqrt(dx * dx + dy * dy);
  }
}

export function lineIntersectsRect(
  x1: number, y1: number, x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  // Check if line segment intersects rectangle
  const left = rx;
  const right = rx + rw;
  const top = ry;
  const bottom = ry + rh;

  // Check if either endpoint is inside
  if (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) return true;
  if (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom) return true;

  // Check each edge of the rectangle
  if (segmentsIntersect(x1, y1, x2, y2, left, top, right, top)) return true;
  if (segmentsIntersect(x1, y1, x2, y2, right, top, right, bottom)) return true;
  if (segmentsIntersect(x1, y1, x2, y2, right, bottom, left, bottom)) return true;
  if (segmentsIntersect(x1, y1, x2, y2, left, bottom, left, top)) return true;

  return false;
}

export function segmentsIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const d1x = x2 - x1, d1y = y2 - y1;
  const d2x = x4 - x3, d2y = y4 - y3;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;
  const dx = x3 - x1, dy = y3 - y1;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export function pointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// Priority queue for A*, Dijkstra etc.
export class PriorityQueue<T> {
  private heap: Array<{ priority: number; item: T }> = [];

  push(item: T, priority: number): void {
    this.heap.push({ priority, item });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].item;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  get size(): number {
    return this.heap.length;
  }

  get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].priority <= this.heap[idx].priority) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < n && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

export function isValidCell(gx: number, gy: number, grid: { width: number; height: number }): boolean {
  return gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height;
}
