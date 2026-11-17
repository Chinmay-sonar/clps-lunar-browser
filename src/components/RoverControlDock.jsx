import React, { useState } from 'react';
import { soundFX } from '../utils/soundFX';

export default function RoverControlDock({
  activeVehicle,
  setActiveVehicle,
  headlightsOn,
  setHeadlightsOn,
  drillState,
  setDrillState
}) {
  const [showSpecs, setShowSpecs] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isRover = (activeVehicle === 'viper' || activeVehicle === 'griffin' || activeVehicle === 'custom-uyor' || activeVehicle === 'custom');
  const hasCustomModel = typeof window !== 'undefined' && (!!window.__CUSTOM_ROVER_URL__ || activeVehicle === 'custom-uyor' || activeVehicle === 'custom');

  const vehicleOptions = [
    { id: 'viper', label: 'VIPER' },
    { id: 'griffin', label: 'GRIFFIN' },
    { id: 'nova-c', label: 'NOVA-C' }
  ];
  if (hasCustomModel) {
    vehicleOptions.push({ id: 'custom-uyor', label: 'CUSTOM' });
  }

  const handleSelectVehicle = (vehicleId) => {
    soundFX.playClick();
    setActiveVehicle(vehicleId);

    if (vehicleId === 'griffin') {
      soundFX.voiceCallout('Griffin Rover 2 surface traverse active.');
    } else if (vehicleId === 'nova-c') {
      soundFX.voiceCallout('Intuitive Machines Nova-C Odysseus linked.');
    } else if (vehicleId === 'custom-uyor' || vehicleId === 'custom') {
      soundFX.voiceCallout('Custom lunar explorer linked. Surface drive ready.');
    } else {
      soundFX.voiceCallout('NASA VIPER lunar rover telemetry linked. Surface drive ready.');
    }
  };

  const triggerKey = (keyCode, duration = 180) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: keyCode, bubbles: true }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: keyCode, bubbles: true }));
    }, duration);
  };

  if (isCollapsed) {
    return (
      <aside style={{
        position: 'absolute',
        top: '68px',
        left: '18px',
        zIndex: 25,
        pointerEvents: 'auto'
      }}>
        <button
          onClick={() => {
            soundFX.playClick();
            setIsCollapsed(false);
          }}
          className="btn-minimal glass-panel"
          style={{
            height: '28px',
            padding: '0 10px',
            gap: '8px',
            fontSize: '0.62rem',
            fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
            color: '#e2e8f0'
          }}
          title="Expand teleoperation dock"
        >
          <span className="dot" style={{ background: '#38bdf8', width: '5px', height: '5px' }} />
          <span>{activeVehicle === 'viper' ? 'ROVER' : 'LANDER'} CONTROLS</span>
          <span style={{ color: 'var(--text-muted)' }}>[OPEN ▾]</span>
        </button>
      </aside>
    );
  }

  return (
    <aside style={{
      position: 'absolute',
      top: '68px',
      left: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 25,
      pointerEvents: 'auto',
      width: '280px'
    }}>
      {/* ─── 1. Vehicle Selector Segmented Bar ─── */}
      <div style={{
        background: 'rgba(6, 8, 13, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-hairline)',
        borderRadius: '7px',
        padding: '3px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
      }}>
        <button
          onClick={() => {
            soundFX.playClick();
            setIsCollapsed(true);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            padding: '0 6px',
            fontSize: '0.65rem',
            cursor: 'pointer'
          }}
          title="Collapse dock"
        >
          ◀
        </button>
        {vehicleOptions.map(item => {
          const isActive = (activeVehicle === item.id) || (item.id === 'nova-c' && activeVehicle === 'lander') || (item.id === 'custom-uyor' && activeVehicle === 'custom');
          return (
            <button
              key={item.id}
              onClick={() => handleSelectVehicle(item.id)}
              style={{
                flex: 1,
                background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 0',
                fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
                fontSize: '0.62rem',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ─── 2. Tactical Surface Hardware Controller (VIPER / Griffin Rover / Custom Rover) ─── */}
      {isRover && (
        <div style={{
          background: 'rgba(6, 8, 13, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '7px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '9px'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot" style={{ background: '#38bdf8', width: '5px', height: '5px' }} />
              <span style={{
                fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
                fontSize: '0.64rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: '#e2e8f0'
              }}>
                {activeVehicle === 'griffin' ? 'GRIFFIN ROVER 2' : (activeVehicle === 'custom' || activeVehicle === 'custom-uyor') ? 'CUSTOM ROVER' : 'VIPER CONTROLS'}
              </span>
            </div>
            <button
              onClick={() => {
                soundFX.playClick();
                setShowSpecs(!showSpecs);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-hairline)',
                borderRadius: '3px',
                color: 'var(--text-muted)',
                padding: '1px 6px',
                fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
                fontSize: '0.56rem',
                letterSpacing: '0.04em',
                cursor: 'pointer'
              }}
            >
              {showSpecs ? 'CLOSE' : 'INFO'}
            </button>
          </div>

          {/* Drive Keypad & Keyboard Helper */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '5px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: '0.58rem', fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                DRIVE [WASD / ARROWS]
              </span>
              <button
                onClick={() => {
                  soundFX.playClick();
                  triggerKey('KeyR', 50);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.56rem',
                  fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                title="Reset rover position back to starting location"
              >
                RESET [R]
              </button>
            </div>

            {/* Tactile Directional D-Pad for Mouse / Touch Users */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 26px)', gap: '3px' }}>
              <div />
              <button
                onMouseDown={() => triggerKey('KeyW', 300)}
                className="btn-minimal"
                style={{ width: '26px', height: '26px', padding: 0, borderRadius: '4px' }}
                title="Drive Forward"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <div />

              <button
                onMouseDown={() => triggerKey('KeyA', 250)}
                className="btn-minimal"
                style={{ width: '26px', height: '26px', padding: 0, borderRadius: '4px' }}
                title="Turn Left"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                onMouseDown={() => triggerKey('Space', 150)}
                className="btn-minimal"
                style={{ width: '26px', height: '26px', padding: 0, borderRadius: '4px', fontSize: '0.55rem', fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif" }}
                title="Brake"
              >
                BRK
              </button>

              <button
                onMouseDown={() => triggerKey('KeyD', 250)}
                className="btn-minimal"
                style={{ width: '26px', height: '26px', padding: 0, borderRadius: '4px' }}
                title="Turn Right"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <div />
              <button
                onMouseDown={() => triggerKey('KeyS', 300)}
                className="btn-minimal"
                style={{ width: '26px', height: '26px', padding: 0, borderRadius: '4px' }}
                title="Reverse"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div />
            </div>
          </div>

          {/* Subsystem 1: Forward Spotlights */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.62rem', fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", color: 'var(--text-secondary)' }}>
              HEADLIGHTS
            </span>
            <button
              onClick={() => {
                soundFX.playClick();
                setHeadlightsOn(!headlightsOn);
              }}
              style={{
                height: '22px',
                padding: '0 8px',
                fontSize: '0.58rem',
                fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
                fontWeight: 600,
                background: headlightsOn ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '3px',
                color: headlightsOn ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {headlightsOn ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Subsystem 2: TRIDENT Percussive Drill */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.62rem', fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", color: 'var(--text-secondary)' }}>
                ICE DRILL
              </span>
              <span style={{ fontSize: '0.58rem', fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", color: 'var(--text-muted)' }}>
                {drillState === 'stowed' ? 'OFF' : drillState === 'drilling' ? 'DRILLING' : 'SAMPLE READY'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {['stowed', 'drilling', 'sampling'].map(state => (
                <button
                  key={state}
                  onClick={() => {
                    soundFX.playClick();
                    setDrillState(state);
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    background: drillState === state ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '3px',
                    color: drillState === state ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.58rem',
                    fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
                    fontWeight: drillState === state ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {state === 'stowed' ? 'OFF' : state === 'drilling' ? 'DRILL' : 'SAMPLE'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Griffin Lander Telemetry Strip ─── */}
      {activeVehicle === 'griffin' && (
        <div style={{
          background: 'rgba(6, 8, 13, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '7px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", fontSize: '0.64rem', fontWeight: 600, color: '#e2e8f0' }}>
              ASTROBOTIC GRIFFIN-1
            </span>
            <span style={{ fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", fontSize: '0.58rem', color: '#34d399' }}>
              NOMINAL
            </span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>
            • Cargo: 475 kg carried to the Moon<br />
            • Thrusters: 7 rocket landing engines<br />
            • Ramps: Two ramps to let the rover roll off
          </div>
        </div>
      )}

      {/* ─── 4. Nova-C Lander Telemetry Strip ─── */}
      {(activeVehicle === 'nova-c' || activeVehicle === 'lander') && (
        <div style={{
          background: 'rgba(6, 8, 13, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '7px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", fontSize: '0.64rem', fontWeight: 600, color: '#e2e8f0' }}>
              INTUITIVE MACHINES NOVA-C
            </span>
            <span style={{ fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", fontSize: '0.58rem', color: '#38bdf8' }}>
              IM-1 ODYSSEUS
            </span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif", lineHeight: 1.5 }}>
            • Engine: Clean rocket fuel (Oxygen + Methane)<br />
            • Navigation: Smart cameras scan hills for landing<br />
            • Landing legs: 6 strong metal landing legs
          </div>
        </div>
      )}

      {/* ─── 5. Architectural Spec Sheet Drawer ─── */}
      {showSpecs && (
        <div style={{
          background: 'rgba(6, 8, 13, 0.94)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '7px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.6rem',
          fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
          color: 'var(--text-secondary)'
        }}>
          <div style={{ color: '#ffffff', fontWeight: 600, borderBottom: '1px solid var(--border-hairline)', paddingBottom: '4px' }}>
            ROVER DETAILS
          </div>
          <div>• 4 all-wheel drive and active steering</div>
          <div>• Top speed: ~0.7 km/h</div>
          <div>• Size: 1.5m wide × 1.5m long</div>
          <div>• Weight: 450 kg on Earth (75 kg on the Moon)</div>
          <div>• Tools: Ice drill, cameras, gas & water ice sensors</div>
        </div>
      )}
    </aside>
  );
}
