import React, { useRef, useEffect } from 'react';
import { Gauge, Navigation, Activity, Zap, ShieldAlert, Award } from 'lucide-react';

export const TelemetryDashboard = ({
  minObstacleDist,
  currentV,
  currentOmega,
  fps,
  totalDistance,
  elapsedTime,
  isCollided,
  isGoalReached,
  historyData, // Array of recent { v, omega, minObstacleDist }
  algName,
  vfhHistogram
}) => {
  const canvasRef = useRef(null);

  // Sparkline Chart rendering for V & Omega
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !historyData || historyData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Plot Linear Velocity (Cyan)
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < historyData.length; i++) {
      const x = (i / (historyData.length - 1)) * width;
      const v = historyData[i].v;
      const y = height - (v / 3.0) * height * 0.8 - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Plot Min Obstacle Distance (Red/Yellow/Green)
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < historyData.length; i++) {
      const x = (i / (historyData.length - 1)) * width;
      const d = historyData[i].minObstacleDist;
      const y = height - (Math.min(d, 5.0) / 5.0) * height * 0.8 - 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [historyData]);

  // Color code obstacle proximity alert
  const getProximityColor = (d) => {
    if (d < 0.5) return 'var(--accent-red)';
    if (d < 1.5) return 'var(--accent-yellow)';
    return 'var(--accent-green)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Metric 1: Min Obstacle Distance */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: `rgba(${minObstacleDist < 0.8 ? '255,82,82' : '0,242,254'}, 0.15)`,
            border: `1px solid ${getProximityColor(minObstacleDist)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getProximityColor(minObstacleDist)
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nearest Obstacle</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: getProximityColor(minObstacleDist) }}>
              {minObstacleDist.toFixed(2)} m
            </div>
          </div>
        </div>

        {/* Metric 2: Linear Velocity */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(56, 239, 125, 0.15)',
            border: '1px solid var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-green)'
          }}>
            <Gauge size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Linear Speed (v)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
              {currentV.toFixed(2)} m/s
            </div>
          </div>
        </div>

        {/* Metric 3: Angular Velocity */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(241, 196, 15, 0.15)',
            border: '1px solid var(--accent-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-yellow)'
          }}>
            <Navigation size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yaw Rate (&omega;)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--accent-yellow)' }}>
              {currentOmega.toFixed(2)} rad/s
            </div>
          </div>
        </div>

        {/* Metric 4: Loop Frequency & Distance */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(157, 78, 221, 0.15)',
            border: '1px solid var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-purple)'
          }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Path Traveled</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
              {totalDistance.toFixed(1)} m ({elapsedTime.toFixed(0)}s)
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Sparkline Graph Panel */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Velocity & Obstacle Distance History (60 FPS Telemetry)</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>— Velocity v</span>
            <span style={{ color: 'var(--accent-red)' }}>— Distance d_min</span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={140}
          style={{ width: '100%', height: '140px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}
        />
      </div>
    </div>
  );
};
