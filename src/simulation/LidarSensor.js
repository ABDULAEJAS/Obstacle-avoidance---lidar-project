/**
 * LiDAR Sensor Simulation Engine
 * Performs 2D multi-beam raycasting against environment obstacles and walls.
 */
export class LidarSensor {
  constructor(config = {}) {
    this.numRays = config.numRays || 64; // Beam count
    this.fov = config.fov || Math.PI * 2; // 360 deg FOV default
    this.maxRange = config.maxRange || 10.0; // Meters
    this.minRange = config.minRange || 0.1; // Meters
    this.addNoise = config.addNoise || false;
    this.noiseStdDev = config.noiseStdDev || 0.05; // 5 cm Gaussian noise
    this.scanData = []; // Array of distance readings
    this.pointCloud = []; // World frame (x, y) points
  }

  updateConfig(config) {
    if (config.numRays !== undefined) this.numRays = config.numRays;
    if (config.fov !== undefined) this.fov = config.fov;
    if (config.maxRange !== undefined) this.maxRange = config.maxRange;
    if (config.minRange !== undefined) this.minRange = config.minRange;
    if (config.addNoise !== undefined) this.addNoise = config.addNoise;
    if (config.noiseStdDev !== undefined) this.noiseStdDev = config.noiseStdDev;
  }

  /**
   * Perform raycast scan from robot position (rx, ry) and heading orientation
   */
  performScan(rx, ry, heading, environment) {
    this.scanData = [];
    this.pointCloud = [];

    const startAngle = heading - this.fov / 2;
    const angleStep = this.fov / this.numRays;

    for (let i = 0; i < this.numRays; i++) {
      const rayAngle = startAngle + i * angleStep;
      let minDistance = this.maxRange;
      let hitPoint = null;

      // 1. Raycast against environment bounding walls
      const wallHit = this.raycastWalls(rx, ry, rayAngle, environment.walls);
      if (wallHit && wallHit.distance < minDistance) {
        minDistance = wallHit.distance;
        hitPoint = wallHit.point;
      }

      // 2. Raycast against circular obstacles
      for (const obstacle of environment.obstacles) {
        const circleHit = this.raycastCircle(rx, ry, rayAngle, obstacle);
        if (circleHit && circleHit.distance < minDistance) {
          minDistance = circleHit.distance;
          hitPoint = circleHit.point;
        }
      }

      // Apply Gaussian Noise if enabled
      let noisyDistance = minDistance;
      if (this.addNoise && minDistance < this.maxRange) {
        const noise = this.gaussianRandom(0, this.noiseStdDev);
        noisyDistance = Math.max(this.minRange, Math.min(this.maxRange, minDistance + noise));
      }

      // Clamp to min/max range
      const validDistance = noisyDistance < this.minRange ? this.maxRange : noisyDistance;

      // Calculate hit point for point cloud
      const px = rx + validDistance * Math.cos(rayAngle);
      const py = ry + validDistance * Math.sin(rayAngle);

      const scanRay = {
        index: i,
        angle: rayAngle,
        relativeAngle: rayAngle - heading,
        distance: validDistance,
        rawDistance: minDistance,
        hit: validDistance < this.maxRange,
        hitPoint: { x: px, y: py }
      };

      this.scanData.push(scanRay);

      if (scanRay.hit) {
        this.pointCloud.push({ x: px, y: py, distance: validDistance, angle: rayAngle });
      }
    }

    return {
      scans: this.scanData,
      pointCloud: this.pointCloud
    };
  }

  /**
   * Raycast against line segments (walls)
   */
  raycastWalls(rx, ry, angle, walls) {
    let closestDist = Infinity;
    let closestPoint = null;

    const r_dx = Math.cos(angle);
    const r_dy = Math.sin(angle);

    for (const wall of walls) {
      // Wall segment endpoints: (x1, y1) to (x2, y2)
      const x1 = wall.x1, y1 = wall.y1, x2 = wall.x2, y2 = wall.y2;
      const w_dx = x2 - x1;
      const w_dy = y2 - y1;

      const denominator = r_dx * w_dy - r_dy * w_dx;
      if (Math.abs(denominator) < 1e-6) continue; // Parallel

      const t1 = ((x1 - rx) * w_dy - (y1 - ry) * w_dx) / denominator;
      const t2 = ((x1 - rx) * r_dy - (y1 - ry) * r_dx) / denominator;

      if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
        if (t1 < closestDist) {
          closestDist = t1;
          closestPoint = { x: rx + t1 * r_dx, y: ry + t1 * r_dy };
        }
      }
    }

    return closestPoint ? { distance: closestDist, point: closestPoint } : null;
  }

  /**
   * Raycast against circular obstacle
   */
  raycastCircle(rx, ry, angle, circle) {
    const r_dx = Math.cos(angle);
    const r_dy = Math.sin(angle);

    const cx = circle.x;
    const cy = circle.y;
    const radius = circle.radius;

    const oc_x = rx - cx;
    const oc_y = ry - cy;

    const b = 2 * (oc_x * r_dx + oc_y * r_dy);
    const c = (oc_x * oc_x + oc_y * oc_y) - radius * radius;

    const discriminant = b * b - 4 * c;
    if (discriminant < 0) return null;

    const sqrtD = Math.sqrt(discriminant);
    let t = (-b - sqrtD) / 2;

    if (t < 0) {
      t = (-b + sqrtD) / 2;
    }

    if (t >= 0) {
      return {
        distance: t,
        point: { x: rx + t * r_dx, y: ry + t * r_dy }
      };
    }

    return null;
  }

  /**
   * Box-Muller transformation for Gaussian noise
   */
  gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }
}
