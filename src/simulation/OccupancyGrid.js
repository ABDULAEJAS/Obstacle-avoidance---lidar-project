/**
 * Occupancy Grid Mapping Module
 * Updates a 2D grid probability map using LiDAR sensor inverse model log-odds
 */
export class OccupancyGrid {
  constructor(width = 16.0, height = 10.0, resolution = 0.2) {
    this.width = width;
    this.height = height;
    this.resolution = resolution; // 0.2m per cell

    this.cols = Math.ceil(width / resolution);
    this.rows = Math.ceil(height / resolution);

    this.grid = new Float32Array(this.cols * this.rows); // Stores log-odds values
    this.l0 = 0.0; // Prior log-odds (unknown)
    this.lOcc = 1.2; // Log-odds update for occupied cell
    this.lFree = -0.7; // Log-odds update for free cell
    this.maxLogOdds = 5.0;
    this.minLogOdds = -5.0;
  }

  reset() {
    this.grid.fill(0);
  }

  /**
   * Update occupancy log-odds given robot pose and LiDAR raycast scan data
   */
  updateGrid(rx, ry, scanRays, maxRange) {
    for (const ray of scanRays) {
      const angle = ray.angle;
      const hitDist = ray.distance;
      const hit = ray.hit;

      // Raytrace cells from robot position to hit point
      const steps = Math.ceil(hitDist / (this.resolution * 0.5));
      for (let s = 0; s <= steps; s++) {
        const dist = (s / steps) * hitDist;
        const cx = rx + dist * Math.cos(angle);
        const cy = ry + dist * Math.sin(angle);

        const col = Math.floor(cx / this.resolution);
        const row = Math.floor(cy / this.resolution);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) continue;

        const idx = row * this.cols + col;

        if (s === steps && hit) {
          // Cell at hit point is OCCUPIED
          this.grid[idx] = Math.min(this.maxLogOdds, this.grid[idx] + this.lOcc);
        } else {
          // Cells along ray path are FREE
          this.grid[idx] = Math.max(this.minLogOdds, this.grid[idx] + this.lFree);
        }
      }
    }
  }

  /**
   * Get occupancy probability [0, 1] for cell (col, row)
   */
  getProbability(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 0.5;
    const logOdds = this.grid[row * this.cols + col];
    return 1 - (1 / (1 + Math.exp(logOdds)));
  }
}
