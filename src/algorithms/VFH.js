/**
 * Vector Field Histogram (VFH+) Obstacle Avoidance Algorithm
 * Builds polar obstacle density histogram from LiDAR scan and searches for candidate open valleys.
 */
export class VFHAlgorithm {
  constructor(config = {}) {
    this.name = 'Vector Field Histogram (VFH+)';
    this.numSectors = config.numSectors || 36; // 10 degrees per sector
    this.threshold = config.threshold || 0.35; // Obstacle density threshold
    this.safetyDistance = config.safetyDistance || 1.8;

    this.histogram = new Float32Array(this.numSectors);
    this.lastSteerAngle = 0;
  }

  updateConfig(config) {
    if (config.numSectors !== undefined) this.numSectors = config.numSectors;
    if (config.threshold !== undefined) this.threshold = config.threshold;
  }

  computeCommand(robot, scanData, goal, dt) {
    const sectorAngle = (Math.PI * 2) / this.numSectors;
    this.histogram.fill(0);

    // 1. Build Polar Obstacle Density Histogram
    for (const scan of scanData) {
      if (!scan.hit) continue;

      const d = scan.distance;
      if (d > this.safetyDistance) continue;

      // Map ray angle to sector index [0, numSectors - 1]
      let normAngle = scan.angle;
      while (normAngle < 0) normAngle += Math.PI * 2;
      while (normAngle >= Math.PI * 2) normAngle -= Math.PI * 2;

      const sectorIdx = Math.floor(normAngle / sectorAngle) % this.numSectors;

      // Obstacle magnitude inversely proportional to distance squared
      const density = (this.safetyDistance - d) / this.safetyDistance;
      this.histogram[sectorIdx] += density;
    }

    // 2. Smooth Histogram (Gaussian 3-tap filter)
    const smoothedHist = new Float32Array(this.numSectors);
    for (let i = 0; i < this.numSectors; i++) {
      const prev = this.histogram[(i - 1 + this.numSectors) % this.numSectors];
      const curr = this.histogram[i];
      const next = this.histogram[(i + 1) % this.numSectors];
      smoothedHist[i] = (prev + 2 * curr + next) / 4.0;
    }

    // 3. Find Goal Sector
    const goalAngle = Math.atan2(goal.y - robot.y, goal.x - robot.x);
    let normGoalAngle = goalAngle;
    while (normGoalAngle < 0) normGoalAngle += Math.PI * 2;
    const goalSector = Math.floor(normGoalAngle / sectorAngle) % this.numSectors;

    // 4. Identify Free Valleys & Select Optimal Sector
    let bestSector = goalSector;
    let minCost = Infinity;

    for (let i = 0; i < this.numSectors; i++) {
      if (smoothedHist[i] < this.threshold) {
        const sectorCenterAngle = i * sectorAngle + sectorAngle / 2;

        // Calculate Cost Function for sector direction
        const goalDiff = Math.abs(this.normalizeAngle(sectorCenterAngle - goalAngle));
        const headDiff = Math.abs(this.normalizeAngle(sectorCenterAngle - robot.theta));
        const steerDiff = Math.abs(this.normalizeAngle(sectorCenterAngle - this.lastSteerAngle));

        const cost = 2.0 * goalDiff + 0.5 * headDiff + 0.3 * steerDiff;

        if (cost < minCost) {
          minCost = cost;
          bestSector = i;
        }
      }
    }

    const targetSteerAngle = bestSector * sectorAngle + sectorAngle / 2;
    this.lastSteerAngle = targetSteerAngle;

    let headingError = this.normalizeAngle(targetSteerAngle - robot.theta);

    // Linear velocity slows down if sharp turning is required
    const turnFactor = Math.max(0.2, Math.cos(headingError));
    const v = robot.maxV * turnFactor;
    const omega = Math.max(-robot.maxOmega, Math.min(robot.maxOmega, headingError * 3.0));

    return {
      v,
      omega,
      histogram: smoothedHist,
      targetSector: bestSector,
      targetAngle: targetSteerAngle
    };
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
}
