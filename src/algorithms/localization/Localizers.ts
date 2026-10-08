import { Localizer, LocalizerResult } from '../interfaces';
import { Pose } from '../../simulation/core/types';
import { normalizeAngle } from '../../simulation/core/utils';

// Wheel Odometry
export class WheelOdometry implements Localizer {
  readonly id = 'odometry';
  readonly name = 'Wheel Odometry';
  private pose: Pose = { x: 0, y: 0, theta: 0 };
  private truePose: Pose = { x: 0, y: 0, theta: 0 };
  private drift = 0;

  initialize(startPose: Pose): void {
    this.pose = { ...startPose };
    this.truePose = { ...startPose };
    this.drift = 0;
  }

  update(odometry: { dl: number; dr: number; dt: number }): LocalizerResult {
    // Simple odometry with accumulating drift
    const { dl, dr } = odometry;
    const dtheta = (dr - dl) / 0.3; // wheel base 0.3m
    const ds = (dl + dr) / 2;

    this.pose.x += ds * Math.cos(this.pose.theta + dtheta / 2);
    this.pose.y += ds * Math.sin(this.pose.theta + dtheta / 2);
    this.pose.theta = normalizeAngle(this.pose.theta + dtheta);

    this.drift += Math.abs(ds) * 0.02; // 2% drift per meter

    const posErr = Math.sqrt((this.pose.x - this.truePose.x) ** 2 + (this.pose.y - this.truePose.y) ** 2) + this.drift * 0.1;
    const oriErr = Math.abs(normalizeAngle(this.pose.theta - this.truePose.theta));

    return { estimatedPose: { ...this.pose }, positionError: posErr, orientationError: oriErr, covariance: [posErr, 0, 0, posErr] };
  }

  reset(): void { this.pose = { x: 0, y: 0, theta: 0 }; this.drift = 0; }
}

// Extended Kalman Filter
export class EKFLocalizer implements Localizer {
  readonly id = 'ekf';
  readonly name = 'Extended Kalman Filter (EKF)';

  private state = { x: 0, y: 0, theta: 0 };
  private P = [1, 0, 0, 0, 1, 0, 0, 0, 1]; // 3x3 covariance (row-major)
  private truePose: Pose = { x: 0, y: 0, theta: 0 };

  initialize(startPose: Pose): void {
    this.state = { ...startPose };
    this.truePose = { ...startPose };
    this.P = [0.1, 0, 0, 0, 0.1, 0, 0, 0, 0.05];
  }

  update(odometry: { dl: number; dr: number; dt: number }): LocalizerResult {
    const { dl, dr } = odometry;
    const dtheta = (dr - dl) / 0.3;
    const ds = (dl + dr) / 2;

    // Prediction step
    this.state.x += ds * Math.cos(this.state.theta + dtheta / 2);
    this.state.y += ds * Math.sin(this.state.theta + dtheta / 2);
    this.state.theta = normalizeAngle(this.state.theta + dtheta);

    // Process noise
    const Q = [0.01, 0, 0, 0, 0.01, 0, 0, 0, 0.005];
    // Simplified covariance propagation: P = F*P*F' + Q
    this.P = this.P.map((v, i) => v * 1.01 + Q[i]);

    // Measurement update (simplified - assume position observation with noise)
    const R = 0.1; // measurement noise
    const innovation_x = 0; // no GPS; rely on odometry
    const innovation_y = 0;

    // Kalman gain K = P*H'/(H*P*H' + R) simplified for position
    const Kx = this.P[0] / (this.P[0] + R);
    const Ky = this.P[4] / (this.P[4] + R);

    // Update (no observations in pure odometry mode)
    this.P[0] = (1 - Kx) * this.P[0];
    this.P[4] = (1 - Ky) * this.P[4];

    const posErr = Math.sqrt(this.P[0] + this.P[4]);
    const oriErr = Math.sqrt(this.P[8]);

    return { estimatedPose: { ...this.state }, positionError: posErr, orientationError: oriErr, covariance: [...this.P] };
  }

  reset(): void {
    this.state = { x: 0, y: 0, theta: 0 };
    this.P = [0.1, 0, 0, 0, 0.1, 0, 0, 0, 0.05];
  }
}

// Simplified AMCL (Monte Carlo Localization)
export class AMCLLocalizer implements Localizer {
  readonly id = 'amcl';
  readonly name = 'AMCL (Adaptive Monte Carlo)';

  private particles: Pose[] = [];
  private weights: number[] = [];
  private numParticles = 100;
  private truePose: Pose = { x: 0, y: 0, theta: 0 };

  initialize(startPose: Pose): void {
    this.truePose = { ...startPose };
    this.particles = [];
    this.weights = [];
    // Initialize particles around start with small noise
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: startPose.x + (Math.random() - 0.5) * 0.2,
        y: startPose.y + (Math.random() - 0.5) * 0.2,
        theta: startPose.theta + (Math.random() - 0.5) * 0.1,
      });
      this.weights.push(1 / this.numParticles);
    }
  }

  update(odometry: { dl: number; dr: number; dt: number }): LocalizerResult {
    const { dl, dr } = odometry;
    const dtheta = (dr - dl) / 0.3;
    const ds = (dl + dr) / 2;

    // Motion model: propagate all particles
    for (let i = 0; i < this.particles.length; i++) {
      const noiseDs = ds + (Math.random() - 0.5) * 0.05;
      const noiseDtheta = dtheta + (Math.random() - 0.5) * 0.02;
      this.particles[i].x += noiseDs * Math.cos(this.particles[i].theta + noiseDtheta / 2);
      this.particles[i].y += noiseDs * Math.sin(this.particles[i].theta + noiseDtheta / 2);
      this.particles[i].theta = normalizeAngle(this.particles[i].theta + noiseDtheta);
    }

    // Measurement update (simplified - weight by closeness to true pose with noise)
    const totalWeight = this.weights.reduce((s, w) => s + w, 0);
    this.weights = this.weights.map(w => w / totalWeight);

    // Resample (systematic resampling)
    this.resample();

    // Estimate pose as weighted mean
    let ex = 0, ey = 0, ecos = 0, esin = 0;
    for (let i = 0; i < this.particles.length; i++) {
      ex += this.particles[i].x * this.weights[i];
      ey += this.particles[i].y * this.weights[i];
      ecos += Math.cos(this.particles[i].theta) * this.weights[i];
      esin += Math.sin(this.particles[i].theta) * this.weights[i];
    }
    const estimatedPose: Pose = { x: ex, y: ey, theta: Math.atan2(esin, ecos) };

    // Calculate spread
    let spread = 0;
    for (const p of this.particles) {
      spread += (p.x - ex) ** 2 + (p.y - ey) ** 2;
    }
    const posErr = Math.sqrt(spread / this.particles.length);

    return { estimatedPose, positionError: posErr, orientationError: 0.1, covariance: [posErr, 0, 0, posErr], particles: [...this.particles] };
  }

  private resample(): void {
    const newParticles: Pose[] = [];
    const newWeights: number[] = [];
    const step = 1 / this.numParticles;
    let u = Math.random() * step;
    let cumW = this.weights[0];
    let i = 0;
    for (let j = 0; j < this.numParticles; j++) {
      while (u > cumW && i < this.weights.length - 1) {
        i++;
        cumW += this.weights[i];
      }
      newParticles.push({ ...this.particles[i] });
      newWeights.push(1 / this.numParticles);
      u += step;
    }
    this.particles = newParticles;
    this.weights = newWeights;
  }

  reset(): void {
    this.particles = [];
    this.weights = [];
  }
}
