/**
 * Robot Kinematics & Physical Dynamic Engine
 * Implements Differential-Drive / Unicycle Kinematics with acceleration constraints
 */
export class RobotKinematics {
  constructor(config = {}) {
    // Pose: x, y in meters, heading theta in radians
    this.x = config.x || 2.0;
    this.y = config.y || 2.0;
    this.theta = config.theta || 0.0;

    // Velocities: v (m/s), omega (rad/s)
    this.v = 0.0;
    this.omega = 0.0;

    // Physical Specs & Constraints
    this.radius = config.radius || 0.35; // 35 cm robot footprint
    this.maxV = config.maxV || 1.5; // m/s
    this.minV = config.minV || -0.5; // m/s
    this.maxOmega = config.maxOmega || Math.PI; // rad/s (~180 deg/s)
    this.maxAccV = config.maxAccV || 1.0; // m/s^2
    this.maxAccOmega = config.maxAccOmega || Math.PI * 1.5; // rad/s^2

    this.isCollided = false;
    this.trail = [];
    this.maxTrailLength = 300;
  }

  updateConfig(config) {
    if (config.radius !== undefined) this.radius = config.radius;
    if (config.maxV !== undefined) this.maxV = config.maxV;
    if (config.minV !== undefined) this.minV = config.minV;
    if (config.maxOmega !== undefined) this.maxOmega = config.maxOmega;
    if (config.maxAccV !== undefined) this.maxAccV = config.maxAccV;
    if (config.maxAccOmega !== undefined) this.maxAccOmega = config.maxAccOmega;
  }

  reset(x = 2.0, y = 2.0, theta = 0.0) {
    this.x = x;
    this.y = y;
    this.theta = theta;
    this.v = 0.0;
    this.omega = 0.0;
    this.isCollided = false;
    this.trail = [{ x: this.x, y: this.y }];
  }

  /**
   * Apply velocity commands (vCmd, omegaCmd) with acceleration limits and integrate pose over dt
   */
  step(vCmd, omegaCmd, dt, environment) {
    if (this.isCollided) return;

    // Clamp command target to max specs
    const targetV = Math.max(this.minV, Math.min(this.maxV, vCmd));
    const targetOmega = Math.max(-this.maxOmega, Math.min(this.maxOmega, omegaCmd));

    // Apply linear acceleration limit
    const deltaV = targetV - this.v;
    const maxDeltaV = this.maxAccV * dt;
    this.v += Math.max(-maxDeltaV, Math.min(maxDeltaV, deltaV));

    // Apply angular acceleration limit
    const deltaOmega = targetOmega - this.omega;
    const maxDeltaOmega = this.maxAccOmega * dt;
    this.omega += Math.max(-maxDeltaOmega, Math.min(maxDeltaOmega, deltaOmega));

    // Kinematic integration
    const nextX = this.x + this.v * Math.cos(this.theta) * dt;
    const nextY = this.y + this.v * Math.sin(this.theta) * dt;
    const nextTheta = this.normalizeAngle(this.theta + this.omega * dt);

    // Collision Check with environment
    if (environment && environment.checkCollision(nextX, nextY, this.radius)) {
      this.isCollided = true;
      this.v = 0;
      this.omega = 0;
      return;
    }

    // Update Pose
    this.x = nextX;
    this.y = nextY;
    this.theta = nextTheta;

    // Append to trail for visual path rendering
    if (this.trail.length === 0 || this.dist(this.x, this.y, this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y) > 0.1) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }
}
