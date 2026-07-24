import React, { useRef, useEffect, useState } from 'react';

export const SimulationCanvas = ({
  environment,
  robot,
  lidar,
  occupancyGrid,
  algorithm,
  algResult,
  showOccupancyGrid,
  showRays,
  showPointCloud,
  showTrajectories,
  showForces,
  interactionMode, // 'select' | 'add_obstacle' | 'move_goal' | 'move_robot'
  onAddObstacle
}) => {
  const canvasRef = useRef(null);
  const [dragItem, setDragItem] = useState(null); // { type: 'robot'|'goal'|'obstacle', index: number }

  // World to screen mapping helpers
  const getTransforms = (canvas) => {
    const scaleX = canvas.width / environment.width;
    const scaleY = canvas.height / environment.height;
    return {
      toScreenX: (worldX) => worldX * scaleX,
      toScreenY: (worldY) => canvas.height - worldY * scaleY, // Flip Y for standard Cartesian coords
      toWorldX: (screenX) => screenX / scaleX,
      toWorldY: (screenY) => (canvas.height - screenY) / scaleY,
      scaleX,
      scaleY
    };
  };

  // Main rendering loop triggered on prop updates / frame ticks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { toScreenX, toScreenY, toWorldX, toWorldY, scaleX, scaleY } = getTransforms(canvas);

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSpacing = 1.0; // 1 meter grid
    for (let x = 0; x <= environment.width; x += gridSpacing) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= environment.height; y += gridSpacing) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(canvas.width, sy);
      ctx.stroke();
    }

    // 2. Draw Occupancy Grid Overlay
    if (showOccupancyGrid && occupancyGrid) {
      for (let r = 0; r < occupancyGrid.rows; r++) {
        for (let c = 0; c < occupancyGrid.cols; c++) {
          const prob = occupancyGrid.getProbability(c, r);
          if (prob > 0.3) {
            const wx = c * occupancyGrid.resolution;
            const wy = r * occupancyGrid.resolution;
            const sx = toScreenX(wx);
            const sy = toScreenY(wy + occupancyGrid.resolution);
            const sw = occupancyGrid.resolution * scaleX;
            const sh = occupancyGrid.resolution * scaleY;

            ctx.fillStyle = `rgba(255, 82, 82, ${prob * 0.45})`;
            ctx.fillRect(sx, sy, sw, sh);
          }
        }
      }
    }

    // 3. Draw Environment Walls
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const wall of environment.walls) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(wall.x1), toScreenY(wall.y1));
      ctx.lineTo(toScreenX(wall.x2), toScreenY(wall.y2));
      ctx.stroke();
    }

    // 4. Draw Circular Obstacles
    for (let i = 0; i < environment.obstacles.length; i++) {
      const obs = environment.obstacles[i];
      const sx = toScreenX(obs.x);
      const sy = toScreenY(obs.y);
      const sRadius = obs.radius * scaleX;

      // Obstacle Fill with gradient
      const grad = ctx.createRadialGradient(sx, sy, sRadius * 0.2, sx, sy, sRadius);
      if (obs.isDynamic) {
        grad.addColorStop(0, '#ff7675');
        grad.addColorStop(1, '#d63031');
      } else {
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#3730a3');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = obs.isDynamic ? '#ff5252' : '#818cf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Velocity arrow for dynamic obstacles
      if (obs.isDynamic) {
        const arrowLen = 1.2;
        const ex = toScreenX(obs.x + obs.vx * arrowLen * 0.3);
        const ey = toScreenY(obs.y + obs.vy * arrowLen * 0.3);
        ctx.strokeStyle = '#ff5252';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }

    // 5. Draw Target Goal
    const goalX = toScreenX(environment.goal.x);
    const goalY = toScreenY(environment.goal.y);
    const goalR = environment.goal.radius * scaleX;

    // Pulsing outer halo
    ctx.strokeStyle = 'rgba(56, 239, 125, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(goalX, goalY, goalR * 1.6, 0, Math.PI * 2);
    ctx.stroke();

    // Goal Center
    ctx.fillStyle = '#38ef7d';
    ctx.beginPath();
    ctx.arc(goalX, goalY, goalR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#38ef7d';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // 6. Draw Robot Path Trail
    if (robot.trail.length > 1) {
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toScreenX(robot.trail[0].x), toScreenY(robot.trail[0].y));
      for (let i = 1; i < robot.trail.length; i++) {
        ctx.lineTo(toScreenX(robot.trail[i].x), toScreenY(robot.trail[i].y));
      }
      ctx.stroke();
    }

    // 7. Draw DWA Sampled Candidate Trajectories
    if (showTrajectories && algResult && algResult.trajectories) {
      for (const traj of algResult.trajectories) {
        if (!traj.points || traj.points.length === 0) continue;

        ctx.strokeStyle = traj.valid ? 'rgba(56, 239, 125, 0.25)' : 'rgba(255, 82, 82, 0.1)';
        ctx.lineWidth = traj.valid ? 1.5 : 1;

        ctx.beginPath();
        ctx.moveTo(toScreenX(traj.points[0].x), toScreenY(traj.points[0].y));
        for (let k = 1; k < traj.points.length; k++) {
          ctx.lineTo(toScreenX(traj.points[k].x), toScreenY(traj.points[k].y));
        }
        ctx.stroke();
      }
    }

    // 8. Draw APF Force Vectors
    if (showForces && algResult && algResult.forces) {
      const rx = toScreenX(robot.x);
      const ry = toScreenY(robot.y);
      const scale = 30; // Screen pixel multiplier for forces

      // Attraction Vector (Green)
      ctx.strokeStyle = '#38ef7d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + algResult.forces.att.x * scale, ry - algResult.forces.att.y * scale);
      ctx.stroke();

      // Repulsion Vector (Red)
      ctx.strokeStyle = '#ff5252';
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + algResult.forces.rep.x * scale, ry - algResult.forces.rep.y * scale);
      ctx.stroke();

      // Resultant Vector (Cyan)
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + algResult.forces.total.x * scale, ry - algResult.forces.total.y * scale);
      ctx.stroke();
    }

    // 9. Draw LiDAR Laser Rays
    if (showRays && lidar.scanData) {
      for (const ray of lidar.scanData) {
        const rx = toScreenX(robot.x);
        const ry = toScreenY(robot.y);
        const px = toScreenX(ray.hitPoint.x);
        const py = toScreenY(ray.hitPoint.y);

        // Ray Color based on distance proximity
        let rayColor = 'rgba(0, 242, 254, 0.25)'; // Normal cyan
        if (ray.distance < 0.8) {
          rayColor = 'rgba(255, 82, 82, 0.8)'; // Red danger
        } else if (ray.distance < 2.0) {
          rayColor = 'rgba(241, 196, 15, 0.5)'; // Yellow warning
        }

        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }

    // 10. Draw LiDAR Point Cloud Dots
    if (showPointCloud && lidar.pointCloud) {
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 6;
      for (const pt of lidar.pointCloud) {
        const px = toScreenX(pt.x);
        const py = toScreenY(pt.y);
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // 11. Draw Robot Body Chassis & Wheels
    const robotX = toScreenX(robot.x);
    const robotY = toScreenY(robot.y);
    const sRobotR = robot.radius * scaleX;

    // Safety Clearance Bubble
    ctx.strokeStyle = robot.isCollided ? '#ff5252' : 'rgba(0, 242, 254, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(robotX, robotY, sRobotR * 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Robot Circle Chassis
    ctx.save();
    ctx.translate(robotX, robotY);
    ctx.rotate(-robot.theta); // Canvas Y is inverted so rotate -theta

    // Main Body
    ctx.fillStyle = robot.isCollided ? '#ff5252' : '#0f172a';
    ctx.strokeStyle = robot.isCollided ? '#ff5252' : '#00f2fe';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, sRobotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wheels (Left & Right Differential Drive Wheels)
    ctx.fillStyle = '#475569';
    const wWidth = sRobotR * 0.8;
    const wHeight = sRobotR * 0.35;
    ctx.fillRect(-wWidth / 2, -sRobotR - wHeight / 2, wWidth, wHeight); // Left Wheel
    ctx.fillRect(-wWidth / 2, sRobotR - wHeight / 2, wWidth, wHeight);  // Right Wheel

    // Orientation Heading Pointer Arrow
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.moveTo(sRobotR * 0.9, 0);
    ctx.lineTo(sRobotR * 0.2, -sRobotR * 0.4);
    ctx.lineTo(sRobotR * 0.2, sRobotR * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

  }, [environment, robot, lidar, occupancyGrid, algResult, showOccupancyGrid, showRays, showPointCloud, showTrajectories, showForces]);

  // Mouse Interaction Handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { toWorldX, toWorldY } = getTransforms(canvas);
    const wx = toWorldX(clickX);
    const wy = toWorldY(clickY);

    if (interactionMode === 'add_obstacle') {
      onAddObstacle(wx, wy);
      return;
    }

    // Check if clicked robot
    if (Math.hypot(wx - robot.x, wy - robot.y) < robot.radius * 1.5) {
      setDragItem({ type: 'robot' });
      return;
    }

    // Check if clicked goal
    if (Math.hypot(wx - environment.goal.x, wy - environment.goal.y) < environment.goal.radius * 2) {
      setDragItem({ type: 'goal' });
      return;
    }

    // Check if clicked obstacle
    for (let i = 0; i < environment.obstacles.length; i++) {
      const obs = environment.obstacles[i];
      if (Math.hypot(wx - obs.x, wy - obs.y) < obs.radius * 1.5) {
        setDragItem({ type: 'obstacle', index: i });
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!dragItem) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { toWorldX, toWorldY } = getTransforms(canvas);
    const wx = Math.max(0.5, Math.min(environment.width - 0.5, toWorldX(mouseX)));
    const wy = Math.max(0.5, Math.min(environment.height - 0.5, toWorldY(mouseY)));

    if (dragItem.type === 'robot') {
      robot.reset(wx, wy, robot.theta);
    } else if (dragItem.type === 'goal') {
      environment.goal.x = wx;
      environment.goal.y = wy;
    } else if (dragItem.type === 'obstacle' && environment.obstacles[dragItem.index]) {
      environment.obstacles[dragItem.index].x = wx;
      environment.obstacles[dragItem.index].y = wy;
    }
  };

  const handleMouseUp = () => {
    setDragItem(null);
  };

  return (
    <div className="glass-panel glass-panel-glow" style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={1120}
        height={700}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ width: '100%', height: '100%', display: 'block', cursor: dragItem ? 'grabbing' : 'crosshair' }}
      />
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        background: 'rgba(0,0,0,0.6)',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }}>
        Mode: {interactionMode.toUpperCase()} | Drag Robot/Goal/Obstacles
      </div>
    </div>
  );
};
