/**
 * Dynamic Window Approach (DWA) Obstacle Avoidance Algorithm
 * Samples velocity space (v, w) considering acceleration limits, obstacle clearance, and goal heading.
 */
export class DWAAlgorithm {
  constructor(config = {}) {
    this.name = 'Dynamic Window Approach (DWA)';
    this.alpha = config.alpha || 0.6; // Goal heading weight
    this.beta = config.beta || 0.3;  // Obstacle distance weight
    this.gamma = config.gamma || 0.1; // Velocity weight

    this.predictTime = config.predictTime || 2.0; // Seconds to simulate trajectory
    this.vSamples = config.vSamples || 10;
    this.omegaSamples = config.omegaSamples || 20;

    this.sampledTrajectories = []; // For visual debug overlay
  }

  updateConfig(config) {
    if (config.alpha !== undefined) this.alpha = config.alpha;
    if (config.beta !== undefined) this.beta = config.beta;
    if (config.gamma !== undefined) this.gamma = config.gamma;
    if (config.predictTime !== undefined) this.predictTime = config.predictTime;
  }

  /**
   * Compute optimal velocity command (v, omega)
   */
  computeCommand(robot, scanData, goal, dt) {
    this.sampledTrajectories = [];

    // 1. Calculate Dynamic Window bounds [vMin, vMax] x [wMin, wMax]
    const vMin = Math.max(robot.minV, robot.v - robot.maxAccV * dt);
    const vMax = Math.min(robot.maxV, robot.v + robot.maxAccV * dt);
    const wMin = Math.max(-robot.maxOmega, robot.omega - robot.maxAccOmega * dt);
    const wMax = Math.min(robot.maxOmega, robot.omega + robot.maxAccOmega * dt);

    let bestScore = -Infinity;
    let bestV = 0.0;
    let bestOmega = 0.0;

    // Collect obstacle points from LiDAR scan
    const obstaclePoints = scanData.filter(s => s.hit).map(s => s.hitPoint);

    const vStep = (vMax - vMin) / (this.vSamples - 1 || 1);
    const wStep = (wMax - wMin) / (this.omegaSamples - 1 || 1);

    for (let i = 0; i < this.vSamples; i++) {
      const v = vMin + i * (vMax === vMin ? 0 : vStep);
      for (let j = 0; j < this.omegaSamples; j++) {
        const w = wMin + j * (wMax === wMin ? 0 : wStep);

        // Predict trajectory for candidate (v, w)
        const traj = this.predictTrajectory(robot.x, robot.y, robot.theta, v, w, this.predictTime);
        const endPose = traj[traj.length - 1];

        // Calculate heading score (1.0 = facing goal directly)
        const goalAngle = Math.atan2(goal.y - endPose.y, goal.x - endPose.x);
        let headingDiff = Math.abs(this.normalizeAngle(goalAngle - endPose.theta));
        const headingScore = Math.PI - headingDiff; // Higher is better

        // Calculate min obstacle clearance along trajectory
        let minClearance = Infinity;
        for (const pt of traj) {
          for (const obs of obstaclePoints) {
            const d = Math.hypot(pt.x - obs.x, pt.y - obs.y) - robot.radius;
            if (d < minClearance) minClearance = d;
          }
        }

        // Safety check: Reject if trajectory causes collision or exceeds stopping distance
        const stoppingDist = (v * v) / (2 * robot.maxAccV);
        if (minClearance <= 0.05 || minClearance < stoppingDist) {
          this.sampledTrajectories.push({ v, w, points: traj, valid: false });
          continue;
        }

        const normHeading = headingScore / Math.PI;
        const normClearance = Math.min(minClearance, 3.0) / 3.0;
        const normVelocity = v / robot.maxV;

        const score = this.alpha * normHeading + this.beta * normClearance + this.gamma * normVelocity;

        this.sampledTrajectories.push({ v, w, points: traj, valid: true, score });

        if (score > bestScore) {
          bestScore = score;
          bestV = v;
          bestOmega = w;
        }
      }
    }

    return { v: bestV, omega: bestOmega, trajectories: this.sampledTrajectories };
  }

  predictTrajectory(x, y, theta, v, w, duration) {
    const points = [{ x, y, theta }];
    const dt = 0.1;
    const steps = Math.floor(duration / dt);

    let curX = x, curY = y, curTheta = theta;
    for (let i = 0; i < steps; i++) {
      curX += v * Math.cos(curTheta) * dt;
      curY += v * Math.sin(curTheta) * dt;
      curTheta = this.normalizeAngle(curTheta + w * dt);
      points.push({ x: curX, y: curY, theta: curTheta });
    }
    return points;
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
}
