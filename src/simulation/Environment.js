/**
 * Environment & World Map Simulation Engine
 * Manages static walls, static circular obstacles, dynamic moving obstacles, and scenarios.
 */
export class Environment {
  constructor(width = 16.0, height = 10.0) {
    this.width = width;
    this.height = height;

    this.walls = [];
    this.obstacles = []; // { x, y, radius, vx, vy, isDynamic }
    this.goal = { x: 14.0, y: 8.0, radius: 0.4 };
    this.startPose = { x: 2.0, y: 2.0, theta: 0 };

    this.currentScenario = 'narrow_corridor';
    this.loadScenario('narrow_corridor');
  }

  /**
   * Load predefined robotics benchmark scenario maps
   */
  loadScenario(scenarioName) {
    this.currentScenario = scenarioName;
    this.obstacles = [];
    this.walls = [];

    // Outer border walls
    const margin = 0.2;
    this.walls.push(
      { x1: margin, y1: margin, x2: this.width - margin, y2: margin },
      { x1: this.width - margin, y1: margin, x2: this.width - margin, y2: this.height - margin },
      { x1: this.width - margin, y1: this.height - margin, x2: margin, y2: this.height - margin },
      { x1: margin, y1: this.height - margin, x2: margin, y2: margin }
    );

    switch (scenarioName) {
      case 'narrow_corridor':
        this.startPose = { x: 2.0, y: 5.0, theta: 0 };
        this.goal = { x: 14.0, y: 5.0, radius: 0.4 };

        // Corridor walls leaving narrow passage in center
        this.walls.push(
          { x1: 5.0, y1: 0.2, x2: 5.0, y2: 3.8 },
          { x1: 5.0, y1: 6.2, x2: 5.0, y2: 9.8 },
          { x1: 10.0, y1: 0.2, x2: 10.0, y2: 4.2 },
          { x1: 10.0, y1: 6.6, x2: 10.0, y2: 9.8 }
        );

        this.obstacles.push(
          { x: 7.5, y: 4.8, radius: 0.75, vx: 0, vy: 0, isDynamic: false },
          { x: 7.5, y: 2.0, radius: 0.6, vx: 0, vy: 0, isDynamic: false },
          { x: 7.5, y: 8.0, radius: 0.6, vx: 0, vy: 0, isDynamic: false },
          { x: 12.0, y: 5.0, radius: 0.8, vx: 0, vy: 0, isDynamic: false }
        );
        break;

      case 'u_trap':
        // Classic local minima trap
        this.startPose = { x: 2.0, y: 5.0, theta: 0 };
        this.goal = { x: 14.0, y: 5.0, radius: 0.4 };

        // Concave U-shaped wall box facing start position
        this.walls.push(
          { x1: 7.0, y1: 3.0, x2: 11.0, y2: 3.0 }, // Bottom wall of U
          { x1: 7.0, y1: 7.0, x2: 11.0, y2: 7.0 }, // Top wall of U
          { x1: 11.0, y1: 3.0, x2: 11.0, y2: 7.0 } // Back wall of U (blocking direct path)
        );

        this.obstacles.push(
          { x: 4.5, y: 3.2, radius: 0.6, vx: 0, vy: 0, isDynamic: false },
          { x: 4.5, y: 6.8, radius: 0.6, vx: 0, vy: 0, isDynamic: false }
        );
        break;

      case 'dynamic_crowd':
        this.startPose = { x: 2.0, y: 2.0, theta: Math.PI / 4 };
        this.goal = { x: 14.0, y: 8.0, radius: 0.4 };

        // Moving obstacles with velocity vectors
        this.obstacles.push(
          { x: 5.0, y: 3.0, radius: 0.65, vx: 0, vy: 1.2, isDynamic: true },
          { x: 8.0, y: 7.0, radius: 0.75, vx: 0, vy: -1.5, isDynamic: true },
          { x: 11.0, y: 2.0, radius: 0.6, vx: -1.0, vy: 0.8, isDynamic: true },
          { x: 6.0, y: 8.0, radius: 0.7, vx: 1.2, vy: -0.5, isDynamic: true },
          { x: 13.0, y: 5.0, radius: 0.65, vx: -0.8, vy: -1.0, isDynamic: true }
        );
        break;

      case 'random_forest':
        this.startPose = { x: 1.5, y: 1.5, theta: Math.PI / 4 };
        this.goal = { x: 14.5, y: 8.5, radius: 0.4 };

        // Grid-like forest of circular trees
        const treeCoords = [
          [4, 2], [4, 5], [4, 8],
          [7, 3], [7, 7],
          [10, 2], [10, 5], [10, 8],
          [12, 3.5], [12, 6.5],
          [6, 4.5], [8.5, 4.5]
        ];
        for (const [cx, cy] of treeCoords) {
          const r = 0.45 + Math.random() * 0.35;
          this.obstacles.push({ x: cx, y: cy, radius: r, vx: 0, vy: 0, isDynamic: false });
        }
        break;

      case 'slalom_maze':
        this.startPose = { x: 1.5, y: 5.0, theta: 0 };
        this.goal = { x: 14.5, y: 5.0, radius: 0.4 };

        // Staggered walls creating a slalom path
        this.walls.push(
          { x1: 4.0, y1: 0.2, x2: 4.0, y2: 6.5 },
          { x1: 7.5, y1: 3.5, x2: 7.5, y2: 9.8 },
          { x1: 11.0, y1: 0.2, x2: 11.0, y2: 6.5 }
        );
        break;

      case 'custom_playground':
      default:
        this.startPose = { x: 2.0, y: 5.0, theta: 0 };
        this.goal = { x: 14.0, y: 5.0, radius: 0.4 };
        this.obstacles.push(
          { x: 8.0, y: 5.0, radius: 1.0, vx: 0, vy: 0, isDynamic: false }
        );
        break;
    }
  }

  /**
   * Step physics for dynamic obstacles
   */
  updateDynamicObstacles(dt) {
    for (const obs of this.obstacles) {
      if (!obs.isDynamic) continue;

      obs.x += obs.vx * dt;
      obs.y += obs.vy * dt;

      // Bounce off environment border
      const minX = 0.5 + obs.radius;
      const maxX = this.width - 0.5 - obs.radius;
      const minY = 0.5 + obs.radius;
      const maxY = this.height - 0.5 - obs.radius;

      if (obs.x < minX) { obs.x = minX; obs.vx *= -1; }
      if (obs.x > maxX) { obs.x = maxX; obs.vx *= -1; }
      if (obs.y < minY) { obs.y = minY; obs.vy *= -1; }
      if (obs.y > maxY) { obs.y = maxY; obs.vy *= -1; }
    }
  }

  /**
   * Check collision of a circle at (x, y) with radius r against walls and obstacles
   */
  checkCollision(x, y, radius) {
    // 1. Check circular obstacles
    for (const obs of this.obstacles) {
      const dist = Math.hypot(x - obs.x, y - obs.y);
      if (dist < radius + obs.radius) return true;
    }

    // 2. Check wall line segments
    for (const wall of this.walls) {
      const distToWall = this.pointToSegmentDistance(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (distToWall < radius) return true;
    }

    return false;
  }

  pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY);
  }

  addObstacle(x, y, radius = 0.6, isDynamic = false) {
    this.obstacles.push({
      x, y, radius,
      vx: isDynamic ? (Math.random() - 0.5) * 2 : 0,
      vy: isDynamic ? (Math.random() - 0.5) * 2 : 0,
      isDynamic
    });
  }

  clearObstacles() {
    this.obstacles = [];
  }
}
