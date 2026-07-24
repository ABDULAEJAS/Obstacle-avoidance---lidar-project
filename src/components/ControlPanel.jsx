import React, { useState } from 'react';
import { Sliders, Radio, Cpu, Layers, PlusCircle, Trash2, Shield, Eye } from 'lucide-react';

export const ControlPanel = ({
  algName,
  onSelectAlgorithm,
  dwaConfig,
  onUpdateDwa,
  apfConfig,
  onUpdateApf,
  vfhConfig,
  onUpdateVfh,
  bugConfig,
  onUpdateBug,
  lidarConfig,
  onUpdateLidar,
  robotConfig,
  onUpdateRobot,
  overlays,
  onToggleOverlay,
  interactionMode,
  onSelectInteractionMode,
  onClearObstacles
}) => {
  const [activeTab, setActiveTab] = useState('algorithm'); // 'algorithm' | 'lidar' | 'robot' | 'overlays'

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Control Drawer Subtabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('algorithm')}
          style={{
            flex: 1,
            padding: '0.4rem',
            fontSize: '0.78rem',
            borderRadius: '6px',
            background: activeTab === 'algorithm' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            color: activeTab === 'algorithm' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: activeTab === 'algorithm' ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <Cpu size={14} />
          <span>Alg</span>
        </button>

        <button
          onClick={() => setActiveTab('lidar')}
          style={{
            flex: 1,
            padding: '0.4rem',
            fontSize: '0.78rem',
            borderRadius: '6px',
            background: activeTab === 'lidar' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            color: activeTab === 'lidar' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: activeTab === 'lidar' ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <Radio size={14} />
          <span>LiDAR</span>
        </button>

        <button
          onClick={() => setActiveTab('robot')}
          style={{
            flex: 1,
            padding: '0.4rem',
            fontSize: '0.78rem',
            borderRadius: '6px',
            background: activeTab === 'robot' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            color: activeTab === 'robot' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: activeTab === 'robot' ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <Shield size={14} />
          <span>Robot</span>
        </button>

        <button
          onClick={() => setActiveTab('overlays')}
          style={{
            flex: 1,
            padding: '0.4rem',
            fontSize: '0.78rem',
            borderRadius: '6px',
            background: activeTab === 'overlays' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            color: activeTab === 'overlays' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: activeTab === 'overlays' ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <Eye size={14} />
          <span>View</span>
        </button>
      </div>

      {/* TAB 1: ALGORITHM SELECTION & TUNING */}
      {activeTab === 'algorithm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Obstacle Avoidance Algorithm
            </label>
            <select
              value={algName}
              onChange={(e) => onSelectAlgorithm(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="DWA">Dynamic Window Approach (DWA)</option>
              <option value="APF">Artificial Potential Field (APF)</option>
              <option value="VFH">Vector Field Histogram (VFH+)</option>
              <option value="BUG">Tangent Bug / Bug2 Algorithm</option>
            </select>
          </div>

          {/* DWA Parameter Tuning */}
          {algName === 'DWA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>DWA Parameters</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Goal Heading Weight (&alpha;)</span>
                  <span className="badge-mono">{dwaConfig.alpha.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={dwaConfig.alpha}
                  onChange={(e) => onUpdateDwa({ alpha: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Clearance Weight (&beta;)</span>
                  <span className="badge-mono">{dwaConfig.beta.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={dwaConfig.beta}
                  onChange={(e) => onUpdateDwa({ beta: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Velocity Weight (&gamma;)</span>
                  <span className="badge-mono">{dwaConfig.gamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={dwaConfig.gamma}
                  onChange={(e) => onUpdateDwa({ gamma: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          )}

          {/* APF Parameter Tuning */}
          {algName === 'APF' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>APF Parameters</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Attraction Gain (k_att)</span>
                  <span className="badge-mono">{apfConfig.kAtt.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={apfConfig.kAtt}
                  onChange={(e) => onUpdateApf({ kAtt: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Repulsion Gain (k_rep)</span>
                  <span className="badge-mono">{apfConfig.kRep.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.2"
                  value={apfConfig.kRep}
                  onChange={(e) => onUpdateApf({ kRep: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Influence Range d0 (m)</span>
                  <span className="badge-mono">{apfConfig.d0.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="4.0"
                  step="0.2"
                  value={apfConfig.d0}
                  onChange={(e) => onUpdateApf({ d0: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          )}

          {/* VFH Parameter Tuning */}
          {algName === 'VFH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>VFH+ Parameters</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Sector Count</span>
                  <span className="badge-mono">{vfhConfig.numSectors}</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="72"
                  step="18"
                  value={vfhConfig.numSectors}
                  onChange={(e) => onUpdateVfh({ numSectors: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Obstacle Density Threshold</span>
                  <span className="badge-mono">{vfhConfig.threshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={vfhConfig.threshold}
                  onChange={(e) => onUpdateVfh({ threshold: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          )}

          {/* BUG Algorithm Tuning */}
          {algName === 'BUG' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>Tangent Bug Parameters</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Target Wall Follow Clearance</span>
                  <span className="badge-mono">{bugConfig.wallDistance.toFixed(2)}m</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.5"
                  step="0.1"
                  value={bugConfig.wallDistance}
                  onChange={(e) => onUpdateBug({ wallDistance: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIDAR SENSOR TUNING */}
      {activeTab === 'lidar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              <span>LiDAR Beam Count (Rays)</span>
              <span className="badge-mono">{lidarConfig.numRays} rays</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[16, 32, 64, 128, 360].map((count) => (
                <button
                  key={count}
                  onClick={() => onUpdateLidar({ numRays: count })}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: '0.3rem',
                    fontSize: '0.75rem',
                    justifyContent: 'center',
                    background: lidarConfig.numRays === count ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255,255,255,0.05)',
                    borderColor: lidarConfig.numRays === count ? 'var(--accent-cyan)' : 'var(--border-color)'
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Field of View (FOV)</span>
              <span className="badge-mono">{Math.round((lidarConfig.fov * 180) / Math.PI)}°</span>
            </div>
            <input
              type="range"
              min={Math.PI / 4}
              max={Math.PI * 2}
              step={Math.PI / 12}
              value={lidarConfig.fov}
              onChange={(e) => onUpdateLidar({ fov: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Max Sensor Range</span>
              <span className="badge-mono">{lidarConfig.maxRange.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="15.0"
              step="0.5"
              value={lidarConfig.maxRange}
              onChange={(e) => onUpdateLidar({ maxRange: parseFloat(e.target.value) })}
            />
          </div>

          {/* Noise Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.8rem' }}>Gaussian Sensor Noise</span>
            <input
              type="checkbox"
              checked={lidarConfig.addNoise}
              onChange={(e) => onUpdateLidar({ addNoise: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
            />
          </div>
        </div>
      )}

      {/* TAB 3: ROBOT KINEMATICS */}
      {activeTab === 'robot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Max Speed (v_max)</span>
              <span className="badge-mono">{robotConfig.maxV.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={robotConfig.maxV}
              onChange={(e) => onUpdateRobot({ maxV: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Max Yaw Speed (&omega;_max)</span>
              <span className="badge-mono">{robotConfig.maxOmega.toFixed(1)} rad/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.2"
              value={robotConfig.maxOmega}
              onChange={(e) => onUpdateRobot({ maxOmega: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span>Robot Footprint Radius</span>
              <span className="badge-mono">{robotConfig.radius.toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.6"
              step="0.05"
              value={robotConfig.radius}
              onChange={(e) => onUpdateRobot({ radius: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      )}

      {/* TAB 4: VIEW OVERLAYS & MAP TOOLS */}
      {activeTab === 'overlays' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>Canvas Layers</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { id: 'showRays', label: 'LiDAR Laser Rays' },
              { id: 'showPointCloud', label: 'Point Cloud Hits' },
              { id: 'showOccupancyGrid', label: 'Occupancy Grid Heatmap' },
              { id: 'showTrajectories', label: 'Candidate Trajectories (DWA)' },
              { id: 'showForces', label: 'Force Vectors (APF)' }
            ].map((layer) => (
              <label key={layer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', cursor: 'pointer' }}>
                <span>{layer.label}</span>
                <input
                  type="checkbox"
                  checked={overlays[layer.id]}
                  onChange={() => onToggleOverlay(layer.id)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
              </label>
            ))}
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)' }} />

          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>Map Editing Tools</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onSelectInteractionMode('add_obstacle')}
              className={`btn-secondary ${interactionMode === 'add_obstacle' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}
            >
              <PlusCircle size={14} />
              <span>Add Obstacle</span>
            </button>
            <button
              onClick={onClearObstacles}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', color: 'var(--accent-red)' }}
            >
              <Trash2 size={14} />
              <span>Clear Map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
