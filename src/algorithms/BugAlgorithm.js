/**
 * Tangent Bug / Bug2 Obstacle Avoidance Algorithm
 * Switches between Motion-to-Goal and Wall-Following modes upon LiDAR obstacle detection.
 */
export class BugAlgorithm {
  constructor(config = {}) {
    this.name = 'Tangent Bug / Bug2 Algorithm';
    this.wallDistance = config.wallDistance || 0.8; // Target distance to wall during wall-following

    this.mode = 'MOTION_TO_GOAL'; // 'MOTION_TO_GOAL' or 'WALL_FOLLOWING'
    this.hitPointDist = Infinity;
    this.wallDirection = 1; // 1 for left-side wall follow, -1 for right-side
  }

  updateConfig(config) {
    if (config.wallDistance !== undefined) this.wallDistance = config.wallDistance;
  }

  computeCommand(robot, scanData, goal, dt) {
    const goalAngle = Math.atan2(goal.y - robot.y, goal.x - robot.x);
    const distToGoal = Math.hypot(goal.x - robot.x, goal.y - robot.y);

    // Find front LiDAR rays pointing towards goal direction (+- 25 degrees)
    let frontBlocked = false;
    let minFrontDist = Infinity;

    for (const scan of scanData) {
      if (!scan.hit) continue;

      const angleToGoalDiff = Math.abs(this.normalizeAngle(scan.angle - goalAngle));
      if (angleToGoalDiff < Math.PI / 6) {
        if (scan.distance < minFrontDist) minFrontDist = scan.distance;
        if (scan.distance < this.wallDistance + robot.radius + 0.3) {
          frontBlocked = true;
        }
      }
    }

    // Mode State Machine Logic
    if (this.mode === 'MOTION_TO_GOAL') {
      if (frontBlocked) {
        // Transition to WALL_FOLLOWING mode
        this.mode = 'WALL_FOLLOWING';
        this.hitPointDist = distToGoal;

        // Choose left or right wall follow direction based on closest obstacle ray
        let minLeftDist = Infinity, minRightDist = Infinity;
        for (const scan of scanData) {
          if (!scan.hit) continue;
          const relAngle = this.normalizeAngle(scan.angle - robot.theta);
          if (relAngle > 0 && scan.distance < minLeftDist) minLeftDist = scan.distance;
          if (relAngle < 0 && scan.distance < minRightDist) minRightDist = scan.distance;
        }
        this.wallDirection = minLeftDist < minRightDist ? -1 : 1; // Follow wall on specified side
      }
    } else if (this.mode === 'WALL_FOLLOWING') {
      // Transition back to MOTION_TO_GOAL if goal path is clear AND robot is closer than hit point
      if (!frontBlocked && distToGoal < this.hitPointDist - 0.5) {
        this.mode = 'MOTION_TO_GOAL';
      }
    }

    // Mode Actions
    let targetHeading = goalAngle;
    let targetSpeed = robot.maxV;

    if (this.mode === 'WALL_FOLLOWING') {
      // Find closest wall ray
      let closestRay = null;
      let minWallDist = Infinity;

      for (const scan of scanData) {
        if (scan.hit && scan.distance < minWallDist) {
          minWallDist = scan.distance;
          closestRay = scan;
        }
      }

      if (closestRay) {
        // Compute parallel tangent angle + distance error correction
        const wallAngle = closestRay.angle;
        const tangentAngle = wallAngle + (Math.PI / 2) * this.wallDirection;
        const distError = minWallDist - (this.wallDistance + robot.radius);

        // Steer slightly towards/away from wall to maintain wallDistance
        const errorCorrection = Math.atan2(distError * 1.5, 1.0) * this.wallDirection;
        targetHeading = tangentAngle + errorCorrection;
        targetSpeed = robot.maxV * 0.7; // Slower speed during wall following
      }
    }

    const headingError = this.normalizeAngle(targetHeading - robot.theta);
    const turnFactor = Math.max(0.2, Math.cos(headingError));
    const v = targetSpeed * turnFactor;
    const omega = Math.max(-robot.maxOmega, Math.min(robot.maxOmega, headingError * 3.0));

    return {
      v,
      omega,
      mode: this.mode,
      hitPointDist: this.hitPointDist
    };
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
}
