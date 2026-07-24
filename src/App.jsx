import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { CodeExportModal } from './components/CodeExportModal';

import { Environment } from './simulation/Environment';
import { RobotKinematics } from './simulation/RobotKinematics';
import { LidarSensor } from './simulation/LidarSensor';
import { OccupancyGrid } from './simulation/OccupancyGrid';

import { DWAAlgorithm } from './algorithms/DWA';
import { APFAlgorithm } from './algorithms/APF';
import { VFHAlgorithm } from './algorithms/VFH';
import { BugAlgorithm } from './algorithms/BugAlgorithm';

export default function App() {
  // Navigation & Control States
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('simulation'); // 'simulation' | 'telemetry' | 'code'
  const [currentScenario, setCurrentScenario] = useState('narrow_corridor');
  const [interactionMode, setInteractionMode] = useState('select'); // 'select' | 'add_obstacle'
  const [fps, setFps] = useState(60);

  // Algorithm State
  const [algName, setAlgName] = useState('DWA'); // 'DWA' | 'APF' | 'VFH' | 'BUG'
  const [algResult, setAlgResult] = useState(null);

  // Configurations
  const [dwaConfig, setDwaConfig] = useState({ alpha: 0.6, beta: 0.3, gamma: 0.1, predictTime: 2.0 });
  const [apfConfig, setApfConfig] = useState({ kAtt: 1.2, kRep: 2.5, d0: 2.5 });
  const [vfhConfig, setVfhConfig] = useState({ numSectors: 36, threshold: 0.35 });
  const [bugConfig, setBugConfig] = useState({ wallDistance: 0.8 });

  const [lidarConfig, setLidarConfig] = useState({ numRays: 64, fov: Math.PI * 2, maxRange: 10.0, addNoise: false, noiseStdDev: 0.05 });
  const [robotConfig, setRobotConfig] = useState({ radius: 0.35, maxV: 1.5, minV: -0.5, maxOmega: Math.PI, maxAccV: 1.0, maxAccOmega: Math.PI * 1.5 });

  const [overlays, setOverlays] = useState({
    showRays: true,
    showPointCloud: true,
    showOccupancyGrid: false,
    showTrajectories: true,
    showForces: true
  });

  // Telemetry buffer
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [isGoalReached, setIsGoalReached] = useState(false);
  const [isCollided, setIsCollided] = useState(false);
  const [minDist, setMinDist] = useState(10.0);
  const [pathDistance, setPathDistance] = useState(0.0);
  const [elapsedTime, setElapsedTime] = useState(0.0);

  // Persistent Simulation Engine instances
  const simRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());

  // Initialize simulation core objects
  if (!simRef.current) {
    const env = new Environment(16.0, 10.0);
    const robot = new RobotKinematics(robotConfig);
    const lidar = new LidarSensor(lidarConfig);
    const occupancyGrid = new OccupancyGrid(16.0, 10.0, 0.2);

    const dwa = new DWAAlgorithm(dwaConfig);
    const apf = new APFAlgorithm(apfConfig);
    const vfh = new VFHAlgorithm(vfhConfig);
    const bug = new BugAlgorithm(bugConfig);

    simRef.current = {
      env, robot, lidar, occupancyGrid,
      dwa, apf, vfh, bug
    };
  }

  // Update configs on engine instances when states change
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.lidar.updateConfig(lidarConfig);
    simRef.current.robot.updateConfig(robotConfig);
    simRef.current.dwa.updateConfig(dwaConfig);
    simRef.current.apf.updateConfig(apfConfig);
    simRef.current.vfh.updateConfig(vfhConfig);
    simRef.current.bug.updateConfig(bugConfig);
  }, [lidarConfig, robotConfig, dwaConfig, apfConfig, vfhConfig, bugConfig]);

  // Main 60 FPS Simulation Step Loop
  const stepSimulation = (dt) => {
    const { env, robot, lidar, occupancyGrid, dwa, apf, vfh, bug } = simRef.current;

    if (robot.isCollided) {
      setIsCollided(true);
      setIsRunning(false);
      return;
    }

    // 1. Update Dynamic Obstacles
    env.updateDynamicObstacles(dt);

    // 2. Perform LiDAR Scan
    const scanResult = lidar.performScan(robot.x, robot.y, robot.theta, env);

    // 3. Calculate minimum obstacle distance
    let currentMinDist = lidar.maxRange;
    for (const scan of scanResult.scans) {
      if (scan.hit && scan.distance < currentMinDist) {
        currentMinDist = scan.distance;
      }
    }
    setMinDist(currentMinDist);

    // 4. Update Occupancy Grid
    if (overlays.showOccupancyGrid) {
      occupancyGrid.updateGrid(robot.x, robot.y, scanResult.scans, lidar.maxRange);
    }

    // 5. Execute Active Obstacle Avoidance Algorithm
    let cmd = { v: 0, omega: 0 };
    if (algName === 'DWA') {
      cmd = dwa.computeCommand(robot, scanResult.scans, env.goal, dt);
    } else if (algName === 'APF') {
      cmd = apf.computeCommand(robot, scanResult.scans, env.goal, dt);
    } else if (algName === 'VFH') {
      cmd = vfh.computeCommand(robot, scanResult.scans, env.goal, dt);
    } else if (algName === 'BUG') {
      cmd = bug.computeCommand(robot, scanResult.scans, env.goal, dt);
    }
    setAlgResult(cmd);

    // 6. Kinematic Step
    const prevX = robot.x;
    const prevY = robot.y;
    robot.step(cmd.v, cmd.omega, dt, env);

    // Accumulate path metrics
    const stepDist = Math.hypot(robot.x - prevX, robot.y - prevY);
    setPathDistance((prev) => prev + stepDist);
    setElapsedTime((prev) => prev + dt);

    // Check Goal Proximity (Goal Reached)
    const distToGoal = Math.hypot(env.goal.x - robot.x, env.goal.y - robot.y);
    if (distToGoal < env.goal.radius + robot.radius) {
      setIsGoalReached(true);
      setIsRunning(false);
    }

    // Telemetry History Buffer Update
    setTelemetryHistory((prev) => {
      const next = [...prev, { v: robot.v, omega: robot.omega, minObstacleDist: currentMinDist }];
      if (next.length > 100) next.shift();
      return next;
    });
  };

  // Animation Loop Effect
  useEffect(() => {
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      // FPS Measurement
      frameCountRef.current++;
      if (timestamp - lastFpsUpdateRef.current >= 500) {
        setFps(Math.round((frameCountRef.current * 1000) / (timestamp - lastFpsUpdateRef.current)));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = timestamp;
      }

      if (isRunning) {
        stepSimulation(dt > 0 ? dt : 0.016);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRunning, algName, overlays]);

  // Scenario Change Handler
  const handleSelectScenario = (scenarioId) => {
    setCurrentScenario(scenarioId);
    const { env, robot, occupancyGrid } = simRef.current;
    env.loadScenario(scenarioId);
    robot.reset(env.startPose.x, env.startPose.y, env.startPose.theta);
    occupancyGrid.reset();
    setIsCollided(false);
    setIsGoalReached(false);
    setIsRunning(false);
    setPathDistance(0);
    setElapsedTime(0);
    setTelemetryHistory([]);
  };

  // Reset Button Handler
  const handleReset = () => {
    const { env, robot, occupancyGrid } = simRef.current;
    robot.reset(env.startPose.x, env.startPose.y, env.startPose.theta);
    occupancyGrid.reset();
    setIsCollided(false);
    setIsGoalReached(false);
    setIsRunning(false);
    setPathDistance(0);
    setElapsedTime(0);
    setTelemetryHistory([]);
  };

  // Step Single Frame
  const handleStep = () => {
    stepSimulation(0.05);
  };

  const handleAddObstacle = (x, y) => {
    simRef.current.env.addObstacle(x, y, 0.6, false);
    setInteractionMode('select');
  };

  const handleClearObstacles = () => {
    simRef.current.env.clearObstacles();
  };

  const { env, robot, lidar, occupancyGrid } = simRef.current;

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Bar */}
      <Header
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        onReset={handleReset}
        onStep={handleStep}
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        fps={fps}
        isGoalReached={isGoalReached}
        isCollided={isCollided}
      />

      {/* Main View Area */}
      {activeTab === 'simulation' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>
          {/* Main 2D Canvas */}
          <SimulationCanvas
            environment={env}
            robot={robot}
            lidar={lidar}
            occupancyGrid={occupancyGrid}
            algorithm={algName}
            algResult={algResult}
            showOccupancyGrid={overlays.showOccupancyGrid}
            showRays={overlays.showRays}
            showPointCloud={overlays.showPointCloud}
            showTrajectories={overlays.showTrajectories}
            showForces={overlays.showForces}
            interactionMode={interactionMode}
            onAddObstacle={handleAddObstacle}
          />

          {/* Sidebar Drawer */}
          <ControlPanel
            algName={algName}
            onSelectAlgorithm={setAlgName}
            dwaConfig={dwaConfig}
            onUpdateDwa={(cfg) => setDwaConfig({ ...dwaConfig, ...cfg })}
            apfConfig={apfConfig}
            onUpdateApf={(cfg) => setApfConfig({ ...apfConfig, ...cfg })}
            vfhConfig={vfhConfig}
            onUpdateVfh={(cfg) => setVfhConfig({ ...vfhConfig, ...cfg })}
            bugConfig={bugConfig}
            onUpdateBug={(cfg) => setBugConfig({ ...bugConfig, ...cfg })}
            lidarConfig={lidarConfig}
            onUpdateLidar={(cfg) => setLidarConfig({ ...lidarConfig, ...cfg })}
            robotConfig={robotConfig}
            onUpdateRobot={(cfg) => setRobotConfig({ ...robotConfig, ...cfg })}
            overlays={overlays}
            onToggleOverlay={(key) => setOverlays({ ...overlays, [key]: !overlays[key] })}
            interactionMode={interactionMode}
            onSelectInteractionMode={setInteractionMode}
            onClearObstacles={handleClearObstacles}
          />
        </div>
      )}

      {/* Telemetry Dashboard Tab */}
      {activeTab === 'telemetry' && (
        <TelemetryDashboard
          minObstacleDist={minDist}
          currentV={robot.v}
          currentOmega={robot.omega}
          fps={fps}
          totalDistance={pathDistance}
          elapsedTime={elapsedTime}
          isCollided={isCollided}
          isGoalReached={isGoalReached}
          historyData={telemetryHistory}
          algName={algName}
          vfhHistogram={algResult ? algResult.histogram : null}
        />
      )}

      {/* Code Export Tab */}
      {activeTab === 'code' && (
        <CodeExportModal algName={algName} />
      )}
    </div>
  );
}
