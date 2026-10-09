import { LocalPlanner, LocalPlannerResult, LocalPlannerConfig, TrajectoryCandidate } from '../interfaces';
import { Pose, Vec2, Environment } from '../../simulation/core/types';
import { checkCollision } from '../../simulation/robot/robot';
import { distance2, normalizeAngle } from '../../simulation/core/utils';

// Dynamic Window Approach - Fox, Burgard, Thrun 1997
export class DWAPlanner implements LocalPlanner {
  readonly id = 'dwa';
  readonly name = 'Dynamic Window Approach (DWA)';

  private config!: LocalPlannerConfig;
  // Track current velocities across calls for proper dynamic windowing
  private curV = 0;
  private curW = 0;

  initialize(config: LocalPlannerConfig): void {
    this.config = config;
    this.curV = 0;
    this.curW = 0;
  }

  compute(pose: Pose, goal: Vec2, env: Environment): LocalPlannerResult {
    const { maxLinearVel, maxAngularVel, maxAccelLinear, maxAccelAngular, dt, horizonTime, robotRadius } = this.config;

    // Dynamic window based on current velocity + reachable velocities
    const vMin = Math.max(0, this.curV - maxAccelLinear * dt * 3);
    const vMax = Math.min(maxLinearVel, this.curV + maxAccelLinear * dt * 3);
    const wMin = Math.max(-maxAngularVel, this.curW - maxAccelAngular * dt * 3);
    const wMax = Math.min(maxAngularVel, this.curW + maxAccelAngular * dt * 3);

    // More samples for better trajectory coverage
    const vSamples = 12, wSamples = 16;
    const candidates: TrajectoryCandidate[] = [];

    // Also always include a zero-v pure rotation set to escape tight spots
    const allVSamples = vSamples + 1; // +1 for v=0 escape

    for (let vi = 0; vi <= allVSamples; vi++) {
      for (let wi = 0; wi <= wSamples; wi++) {
        const v = vi === allVSamples ? 0 : vMin + (vi / vSamples) * (vMax - vMin);
        const w = wMin + (wi / wSamples) * (wMax - wMin);

        // Simulate trajectory
        const trajectory = this.simulateTrajectory(pose, v, w, horizonTime, dt);
        const collides = this.checkTrajectoryCollision(trajectory, robotRadius, env);

        // Score trajectory
        const endPose = trajectory[trajectory.length - 1] ?? pose;
        const headingScore = this.headingScore(endPose, goal);
        const distScore = 1 / (1 + distance2(endPose, goal));
        const velocityScore = v / maxLinearVel;
        const clearanceScore = collides ? 0 : this.clearanceScore(trajectory, robotRadius, env);
        // Penalize trajectories going away from goal
        const goalHeadingNow = this.headingScore(pose, goal);
        const goalImprovement = headingScore - goalHeadingNow * 0.5;

        const score = collides
          ? -1
          : headingScore * 0.45 + distScore * 0.25 + velocityScore * 0.1 + clearanceScore * 0.2;

        candidates.push({ v, w, trajectory: trajectory.map(p => ({ x: p.x, y: p.y })), score, collides });
      }
    }

    // Select best non-colliding trajectory
    let best = candidates.find(c => !c.collides) ?? candidates[0];
    for (const c of candidates) {
      if (c.score > best.score) best = c;
    }

    // If ALL trajectories collide, rotate in place to escape (recovery behavior)
    const allCollide = candidates.every(c => c.collides);
    if (allCollide) {
      // Turn toward goal with max angular velocity
      const goalAngle = Math.atan2(goal.y - pose.y, goal.x - pose.x);
      const angleError = normalizeAngle(goalAngle - pose.theta);
      const escapeW = angleError >= 0 ? maxAngularVel * 0.8 : -maxAngularVel * 0.8;
      const escapeTraj = this.simulateTrajectory(pose, 0, escapeW, horizonTime, dt);
      this.curV = 0;
      this.curW = escapeW;
      return {
        cmdLinear: 0,
        cmdAngular: escapeW,
        candidateTrajectories: candidates,
        selectedTrajectory: escapeTraj.map(p => ({ x: p.x, y: p.y })),
      };
    }

    // Store velocities for next call
    this.curV = best.v;
    this.curW = best.w;

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
    // Use a slightly larger radius for trajectory checking (safety margin)
    const safeRadius = radius * 1.15;
    for (const p of traj) {
      if (checkCollision(p.x, p.y, safeRadius, env)) return true;
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
    return Math.min(1, Math.max(0, minDist / 1.5));
  }

  reset(): void {
    this.curV = 0;
    this.curW = 0;
  }
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
