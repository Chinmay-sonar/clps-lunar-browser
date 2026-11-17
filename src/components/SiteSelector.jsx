import React from 'react';
import { LANDING_SITES } from '../data/landingSites';
import { soundFX } from '../utils/soundFX';

export default function SiteSelector({
  isOpen,
  onClose,
  selectedSite,
  onSelectSite
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 6, 8, 0.7)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div className="sub-tag" style={{ letterSpacing: '0.12em', color: '#94a3b8' }}>
              NASA ARTEMIS III & CLPS CANDIDATES
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.015em',
              marginTop: '4px'
            }}>
              Select Candidate Landing Site
            </h2>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="btn-minimal"
            style={{ width: '28px', height: '28px', padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Bento Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          overflowY: 'auto'
        }}>
          {LANDING_SITES.map(site => {
            const isSelected = selectedSite.id === site.id;
            return (
              <div
                key={site.id}
                onClick={() => {
                  soundFX.playClick();
                  onSelectSite(site);
                  onClose();
                }}
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isSelected ? '#ffffff' : 'var(--border-hairline)'}`,
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="sub-tag" style={{ color: isSelected ? '#ffffff' : 'var(--text-muted)' }}>
                    {site.targetType.split('/')[0]}
                  </span>
                  {isSelected && (
                    <span className="dot" style={{ background: '#ffffff' }}></span>
                  )}
                </div>

                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.02rem',
                  fontWeight: 500,
                  color: '#ffffff',
                  marginBottom: '6px',
                  letterSpacing: '-0.01em'
                }}>
                  {site.name}
                </div>

                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  marginBottom: '10px'
                }}>
                  {site.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-hairline)',
                  paddingTop: '8px'
                }}>
                  <span>ELEV +{site.elevationMeters}m</span>
                  <span>SUN {site.illuminationPct}%</span>
                  <span>PSR {site.psrDistanceKm}km</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
