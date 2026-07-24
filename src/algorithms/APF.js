/**
 * Artificial Potential Field (APF) Obstacle Avoidance Algorithm
 * Computes attractive force to goal + repulsive forces from LiDAR obstacle points
 */
export class APFAlgorithm {
  constructor(config = {}) {
    this.name = 'Artificial Potential Field (APF)';
    this.kAtt = config.kAtt || 1.2; // Goal attraction gain
    this.kRep = config.kRep || 2.5; // Obstacle repulsion gain
    this.d0 = config.d0 || 2.5;     // Influence threshold distance (meters)
    
    // Local minimum trap detector & escape perturbation
    this.stuckTimer = 0;
    this.escapeVector = null;
  }

  updateConfig(config) {
    if (config.kAtt !== undefined) this.kAtt = config.kAtt;
    if (config.kRep !== undefined) this.kRep = config.kRep;
    if (config.d0 !== undefined) this.d0 = config.d0;
  }

  computeCommand(robot, scanData, goal, dt) {
    // 1. Calculate Attractive Force to Goal
    const dxGoal = goal.x - robot.x;
    const dyGoal = goal.y - robot.y;
    const distToGoal = Math.hypot(dxGoal, dyGoal);

    let fAttX = this.kAtt * (dxGoal / (distToGoal || 1));
    let fAttY = this.kAtt * (dyGoal / (distToGoal || 1));

    // 2. Calculate Repulsive Forces from LiDAR scan points
    let fRepX = 0;
    let fRepY = 0;

    for (const scan of scanData) {
      if (!scan.hit) continue;

      const d = scan.distance - robot.radius;
      if (d <= 0.05) continue;

      if (d < this.d0) {
        // Unit vector pointing FROM obstacle TO robot
        const angle = scan.angle;
        const obsX = scan.hitPoint.x;
        const obsY = scan.hitPoint.y;

        const vecX = robot.x - obsX;
        const vecY = robot.y - obsY;
        const dist = Math.hypot(vecX, vecY) || 0.001;

        const uX = vecX / dist;
        const uY = vecY / dist;

        // Repulsive force magnitude
        const mag = this.kRep * (1.0 / d - 1.0 / this.d0) * (1.0 / (d * d));
        fRepX += mag * uX;
        fRepY += mag * uY;
      }
    }

    // 3. Resultant Force
    let fTotalX = fAttX + fRepX;
    let fTotalY = fAttY + fRepY;

    // Local Minimum Detection & Escape Random Perturbation
    const totalMag = Math.hypot(fTotalX, fTotalY);
    if (totalMag < 0.3 && distToGoal > 1.0) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.5) {
        // Inject tangential escape force
        const escapeAngle = robot.theta + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
        fTotalX += Math.cos(escapeAngle) * 2.0;
        fTotalY += Math.sin(escapeAngle) * 2.0;
      }
    } else {
      this.stuckTimer = 0;
    }

    // Convert force vector to robot heading and velocity
    const targetHeading = Math.atan2(fTotalY, fTotalX);
    let headingError = this.normalizeAngle(targetHeading - robot.theta);

    // Linear velocity scales with heading alignment
    const alignFactor = Math.max(0, Math.cos(headingError));
    const v = robot.maxV * alignFactor * Math.min(1.0, totalMag / 2.0);
    const omega = Math.max(-robot.maxOmega, Math.min(robot.maxOmega, headingError * 2.5));

    return {
      v,
      omega,
      forces: {
        att: { x: fAttX, y: fAttY },
        rep: { x: fRepX, y: fRepY },
        total: { x: fTotalX, y: fTotalY }
      }
    };
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
}
