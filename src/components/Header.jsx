import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Radio, Activity, Code, Settings, MapPin } from 'lucide-react';

export const Header = ({
  isRunning,
  onToggleRun,
  onReset,
  onStep,
  currentScenario,
  onSelectScenario,
  activeTab,
  onTabChange,
  fps,
  isGoalReached,
  isCollided
}) => {
  const scenarios = [
    { id: 'narrow_corridor', label: 'Narrow Corridor' },
    { id: 'u_trap', label: 'U-Trap (Local Minima)' },
    { id: 'dynamic_crowd', label: 'Dynamic Crowd' },
    { id: 'random_forest', label: 'Random Forest' },
    { id: 'slalom_maze', label: 'Slalom Maze' },
    { id: 'custom_playground', label: 'Custom Playground' },
  ];

  return (
    <header className="glass-panel" style={{ padding: '0.85rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      {/* Title & Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(0,242,254,0.2), rgba(79,172,254,0.3))',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-cyan)'
        }}>
          <Radio size={22} className="pulse-indicator" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LiDAR Obstacle Avoidance
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Real-Time Robotics Simulation & Algorithm Workbench
          </p>
        </div>
      </div>

      {/* Scenario Picker & Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={16} style={{ color: 'var(--accent-cyan)' }} />
          <select
            value={currentScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            style={{ fontSize: '0.85rem', fontWeight: '500' }}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

        {/* Play / Pause / Step / Reset */}
        <button
          onClick={onToggleRun}
          className={isRunning ? "btn-secondary" : "btn-primary"}
          style={{ padding: '0.45rem 1rem' }}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          <span>{isRunning ? 'Pause' : 'Start Sim'}</span>
        </button>

        <button onClick={onStep} className="btn-icon" title="Step 1 Frame" disabled={isRunning}>
          <SkipForward size={16} />
        </button>

        <button onClick={onReset} className="btn-icon" title="Reset Simulation">
          <RotateCcw size={16} />
        </button>

        {/* Status indicator */}
        <div className="badge-mono" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isCollided ? (
            <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>COLLISION!</span>
          ) : isGoalReached ? (
            <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>GOAL REACHED!</span>
          ) : (
            <>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRunning ? 'var(--accent-green)' : 'var(--accent-yellow)' }} />
              {fps} FPS
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <button
          onClick={() => onTabChange('simulation')}
          className={`btn-secondary ${activeTab === 'simulation' ? 'active' : ''}`}
          style={{
            padding: '0.4rem 0.85rem',
            fontSize: '0.85rem',
            background: activeTab === 'simulation' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            borderColor: activeTab === 'simulation' ? 'var(--accent-cyan)' : 'transparent',
            color: activeTab === 'simulation' ? 'var(--accent-cyan)' : 'var(--text-muted)'
          }}
        >
          <Settings size={15} />
          <span>Simulator</span>
        </button>

        <button
          onClick={() => onTabChange('telemetry')}
          className={`btn-secondary ${activeTab === 'telemetry' ? 'active' : ''}`}
          style={{
            padding: '0.4rem 0.85rem',
            fontSize: '0.85rem',
            background: activeTab === 'telemetry' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            borderColor: activeTab === 'telemetry' ? 'var(--accent-cyan)' : 'transparent',
            color: activeTab === 'telemetry' ? 'var(--accent-cyan)' : 'var(--text-muted)'
          }}
        >
          <Activity size={15} />
          <span>Telemetry</span>
        </button>

        <button
          onClick={() => onTabChange('code')}
          className={`btn-secondary ${activeTab === 'code' ? 'active' : ''}`}
          style={{
            padding: '0.4rem 0.85rem',
            fontSize: '0.85rem',
            background: activeTab === 'code' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            borderColor: activeTab === 'code' ? 'var(--accent-cyan)' : 'transparent',
            color: activeTab === 'code' ? 'var(--accent-cyan)' : 'var(--text-muted)'
          }}
        >
          <Code size={15} />
          <span>Code Export</span>
        </button>
      </div>
    </header>
  );
};
