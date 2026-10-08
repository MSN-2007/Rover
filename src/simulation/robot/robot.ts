import { Pose, LidarReading, SimulationConfig, Vec2 } from '../core/types';
import { Environment } from '../core/types';
import { lineIntersectsRect, normalizeAngle } from '../core/utils';

export interface RobotPhysics {
  pose: Pose;
  linearVelocity: number;
  angularVelocity: number;
  radius: number;
}

export function createRobot(startPose: Pose): RobotPhysics {
  return {
    pose: { ...startPose },
    linearVelocity: 0,
    angularVelocity: 0,
    radius: 0.25, // 25 cm radius
  };
}

export function updateRobotPhysics(
  robot: RobotPhysics,
  cmdLinear: number,
  cmdAngular: number,
  dt: number,
  config: SimulationConfig,
  env: Environment
): void {
  // Apply acceleration limits
  const maxAccel = config.maxAcceleration * dt;
  const targetLinear = Math.max(-config.maxLinearVelocity, Math.min(config.maxLinearVelocity, cmdLinear));
  const targetAngular = Math.max(-config.maxAngularVelocity, Math.min(config.maxAngularVelocity, cmdAngular));

  robot.linearVelocity = clampWithAccel(robot.linearVelocity, targetLinear, maxAccel);
  robot.angularVelocity = clampWithAccel(robot.angularVelocity, targetAngular, maxAccel * 2);

  // Apply wheel slip noise
  const slipFactor = 1 - config.wheelSlip * 0.5;
  const noisyLinear = robot.linearVelocity * slipFactor;
  const noisyAngular = robot.angularVelocity;

  // Differential drive kinematics
  const dx = noisyLinear * Math.cos(robot.pose.theta) * dt;
  const dy = noisyLinear * Math.sin(robot.pose.theta) * dt;
  const dtheta = noisyAngular * dt;

  const newX = robot.pose.x + dx;
  const newY = robot.pose.y + dy;
  const newTheta = normalizeAngle(robot.pose.theta + dtheta);

  // Collision detection
  if (!checkCollision(newX, newY, robot.radius, env)) {
    robot.pose.x = newX;
    robot.pose.y = newY;
  } else {
    // Stop on collision
    robot.linearVelocity = 0;
  }
  robot.pose.theta = newTheta;
}

function clampWithAccel(current: number, target: number, maxAccel: number): number {
  const diff = target - current;
  if (Math.abs(diff) <= maxAccel) return target;
  return current + Math.sign(diff) * maxAccel;
}

export function checkCollision(x: number, y: number, radius: number, env: Environment): boolean {
  const allObs = [...env.walls, ...env.furniture, ...env.dynamicObstacles];
  for (const obs of allObs) {
    // AABB vs circle collision
    const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.width));
    const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.height));
    const dx = x - closestX;
    const dy = y - closestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

export function simulateLidar(
  pose: Pose,
  config: SimulationConfig,
  env: Environment
): LidarReading[] {
  const readings: LidarReading[] = [];
  const numRays = 36; // 36 rays = 10 degree resolution
  const angleStep = (2 * Math.PI) / numRays;

  for (let i = 0; i < numRays; i++) {
    const angle = pose.theta + i * angleStep;
    const reading = castRay(pose.x, pose.y, angle, config.lidarRange, config.lidarNoise, env);
    readings.push({ ...reading, angle: normalizeAngle(angle) });
  }

  return readings;
}

function castRay(
  ox: number, oy: number,
  angle: number,
  maxRange: number,
  noise: number,
  env: Environment
): Omit<LidarReading, 'angle'> {
  const step = 0.05; // Ray marching step size
  let dist = 0;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  const allObs = [...env.walls, ...env.furniture, ...env.dynamicObstacles];

  while (dist < maxRange) {
    dist += step;
    const px = ox + dx * dist;
    const py = oy + dy * dist;

    for (const obs of allObs) {
      if (px >= obs.x && px <= obs.x + obs.width && py >= obs.y && py <= obs.y + obs.height) {
        // Add noise
        const noisyDist = dist + (Math.random() - 0.5) * noise * maxRange;
        const hitDist = Math.max(0, Math.min(maxRange, noisyDist));
        return {
          distance: hitDist,
          hit: true,
          hitPoint: { x: ox + dx * hitDist, y: oy + dy * hitDist },
        };
      }
    }
  }

  return {
    distance: maxRange,
    hit: false,
    hitPoint: { x: ox + dx * maxRange, y: oy + dy * maxRange },
  };
}
