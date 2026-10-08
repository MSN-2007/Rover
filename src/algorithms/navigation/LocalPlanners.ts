import { LocalPlanner, LocalPlannerResult, LocalPlannerConfig, TrajectoryCandidate } from '../interfaces';
import { Pose, Vec2, Environment } from '../../simulation/core/types';
import { checkCollision } from '../../simulation/robot/robot';
import { distance2, normalizeAngle } from '../../simulation/core/utils';

// Dynamic Window Approach - Fox, Burgard, Thrun 1997
export class DWAPlanner implements LocalPlanner {
  readonly id = 'dwa';
  readonly name = 'Dynamic Window Approach (DWA)';

  private config!: LocalPlannerConfig;

  initialize(config: LocalPlannerConfig): void {
    this.config = config;
  }

  compute(pose: Pose, goal: Vec2, env: Environment): LocalPlannerResult {
    const { maxLinearVel, maxAngularVel, maxAccelLinear, maxAccelAngular, dt, horizonTime, robotRadius } = this.config;

    // Current velocities (simplified - assume 0 for now; full impl would take prev vel)
    const curV = 0, curW = 0;

    // Dynamic window
    const vMin = Math.max(-maxLinearVel, curV - maxAccelLinear * dt);
    const vMax = Math.min(maxLinearVel, curV + maxAccelLinear * dt);
    const wMin = Math.max(-maxAngularVel, curW - maxAccelAngular * dt);
    const wMax = Math.min(maxAngularVel, curW + maxAccelAngular * dt);

    const vSamples = 8, wSamples = 12;
    const candidates: TrajectoryCandidate[] = [];

    for (let vi = 0; vi <= vSamples; vi++) {
      for (let wi = 0; wi <= wSamples; wi++) {
        const v = vMin + (vi / vSamples) * (vMax - vMin);
        const w = wMin + (wi / wSamples) * (wMax - wMin);

        // Simulate trajectory
        const trajectory = this.simulateTrajectory(pose, v, w, horizonTime, dt);
        const collides = this.checkTrajectoryCollision(trajectory, robotRadius, env);

        // Score
        const headingScore = this.headingScore(trajectory[trajectory.length - 1] ?? pose, goal);
        const distScore = 1 / (1 + distance2(trajectory[trajectory.length - 1] ?? pose, goal));
        const velocityScore = v / maxLinearVel;
        const clearanceScore = collides ? 0 : this.clearanceScore(trajectory, robotRadius, env);

        const score = collides ? -1 : headingScore * 0.4 + distScore * 0.3 + velocityScore * 0.1 + clearanceScore * 0.2;

        candidates.push({ v, w, trajectory: trajectory.map(p => ({ x: p.x, y: p.y })), score, collides });
      }
    }

    // Select best
    let best = candidates[0];
    for (const c of candidates) {
      if (c.score > best.score) best = c;
    }

    return {
      cmdLinear: best.v,
      cmdAngular: best.w,
      candidateTrajectories: candidates,
      selectedTrajectory: best.trajectory,
    };
  }

  private simulateTrajectory(pose: Pose, v: number, w: number, duration: number, dt: number): Pose[] {
    const traj: Pose[] = [];
    let x = pose.x, y = pose.y, theta = pose.theta;
    for (let t = 0; t < duration; t += dt) {
      theta = normalizeAngle(theta + w * dt);
      x += v * Math.cos(theta) * dt;
      y += v * Math.sin(theta) * dt;
      traj.push({ x, y, theta });
    }
    return traj;
  }

  private checkTrajectoryCollision(traj: Pose[], radius: number, env: Environment): boolean {
    for (const p of traj) {
      if (checkCollision(p.x, p.y, radius, env)) return true;
    }
    return false;
  }

  private headingScore(pose: Pose, goal: Vec2): number {
    const angle = Math.atan2(goal.y - pose.y, goal.x - pose.x);
    const diff = Math.abs(normalizeAngle(angle - pose.theta));
    return (Math.PI - diff) / Math.PI;
  }

  private clearanceScore(traj: Pose[], radius: number, env: Environment): number {
    let minDist = Infinity;
    const allObs = [...env.walls, ...env.furniture, ...env.dynamicObstacles];
    for (const p of traj) {
      for (const obs of allObs) {
        const closestX = Math.max(obs.x, Math.min(p.x, obs.x + obs.width));
        const closestY = Math.max(obs.y, Math.min(p.y, obs.y + obs.height));
        const d = Math.sqrt((p.x - closestX) ** 2 + (p.y - closestY) ** 2) - radius;
        minDist = Math.min(minDist, d);
      }
    }
    return Math.min(1, Math.max(0, minDist / 2));
  }

  reset(): void {}
}

// Vector Field Histogram - Borenstein & Koren 1991
export class VFHPlanner implements LocalPlanner {
  readonly id = 'vfh';
  readonly name = 'Vector Field Histogram (VFH)';

  private config!: LocalPlannerConfig;

  initialize(config: LocalPlannerConfig): void {
    this.config = config;
  }

  compute(pose: Pose, goal: Vec2, env: Environment): LocalPlannerResult {
    const numSectors = 36;
    const sectorAngle = (2 * Math.PI) / numSectors;
    const histogram = new Array(numSectors).fill(0);

    // Build polar obstacle density histogram
    const allObs = [...env.walls, ...env.furniture, ...env.dynamicObstacles];
    for (const obs of allObs) {
      const cx = obs.x + obs.width / 2;
      const cy = obs.y + obs.height / 2;
      const dx = cx - pose.x, dy = cy - pose.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.config.maxLinearVel * 3) continue;
      const angle = Math.atan2(dy, dx);
      const sector = Math.floor(normalizeAngle(angle - pose.theta + Math.PI) / sectorAngle) % numSectors;
      const idx = (sector + numSectors) % numSectors;
      histogram[idx] += Math.max(0, 1 - dist / 5);
    }

    // Find best valley
    const goalAngle = Math.atan2(goal.y - pose.y, goal.x - pose.x);
    const goalSector = Math.floor(normalizeAngle(goalAngle - pose.theta + Math.PI) / sectorAngle) % numSectors;

    let bestSector = goalSector;
    let bestCost = Infinity;
    for (let s = 0; s < numSectors; s++) {
      if (histogram[s] > 0.5) continue;
      const angular_diff = Math.abs(normalizeAngle((s - goalSector) * sectorAngle));
      const cost = angular_diff + histogram[s] * 2;
      if (cost < bestCost) { bestCost = cost; bestSector = s; }
    }

    const targetAngle = pose.theta + (bestSector - numSectors / 2) * sectorAngle;
    const angularError = normalizeAngle(targetAngle - pose.theta);
    const cmdW = Math.max(-this.config.maxAngularVel, Math.min(this.config.maxAngularVel, angularError * 2));
    const cmdV = this.config.maxLinearVel * (1 - Math.abs(angularError) / Math.PI);

    const traj = this.simulateTrajectory(pose, cmdV, cmdW, this.config.horizonTime, this.config.dt);

    return {
      cmdLinear: cmdV,
      cmdAngular: cmdW,
      candidateTrajectories: [{ v: cmdV, w: cmdW, trajectory: traj, score: 1, collides: false }],
      selectedTrajectory: traj,
    };
  }

  private simulateTrajectory(pose: Pose, v: number, w: number, duration: number, dt: number): Vec2[] {
    const traj: Vec2[] = [];
    let x = pose.x, y = pose.y, theta = pose.theta;
    for (let t = 0; t < duration; t += dt) {
      theta = normalizeAngle(theta + w * dt);
      x += v * Math.cos(theta) * dt;
      y += v * Math.sin(theta) * dt;
      traj.push({ x, y });
    }
    return traj;
  }

  reset(): void {}
}
