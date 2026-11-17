import React, { useState, useEffect } from 'react';
import { soundFX } from '../utils/soundFX';
import { getSiteDrillAssay } from '../data/lunarCoreDrillAssays';

export default function LunarCoreDrillModal({
  isOpen,
  onClose,
  drillState = 'drilling',
  siteId = 'nobile-rim-1',
  roverName = 'VIPER ROVER'
}) {
  const [currentDepthCm, setCurrentDepthCm] = useState(12);

  const assay = getSiteDrillAssay(siteId);

  // Progressive depth simulation while drilling
  useEffect(() => {
    if (!isOpen) return;
    if (drillState === 'drilling') {
      const interval = setInterval(() => {
        setCurrentDepthCm(prev => {
          if (prev >= 100) return 100;
          return prev + 2;
        });
      }, 120);
      return () => clearInterval(interval);
    } else {
      setCurrentDepthCm(100);
    }
  }, [isOpen, drillState]);

  if (!isOpen) return null;

  const isComplete = currentDepthCm >= 100 || drillState === 'sampling';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          background: 'rgba(11, 14, 20, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.15)',
          padding: '24px 28px',
          color: '#ffffff',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#38bdf8', letterSpacing: '0.08em', fontWeight: 600 }}>
              NASA TRIDENT 1M CORE DRILL & NIRVSS / MSOLO SPECTROMETER
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 500, margin: '4px 0 0 0', color: '#ffffff' }}>
              Subsurface Lunar Regolith Assay Report
            </h2>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Drill Progress Banner */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>TARGET SITE & ROVER</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
              {assay.siteName} ({assay.coordinates})
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>CORE PENETRATION</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: isComplete ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {currentDepthCm} / 100 cm {isComplete ? '• COMPLETE' : '• DRILLING...'}
            </div>
          </div>
        </div>

        {/* Primary Water Ice Discovery Hero Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.04em' }}>
              DETECTED CRYOGENIC WATER-ICE EQUIVALENT
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {assay.waterIceWtPct} <span style={{ fontSize: '20px', fontWeight: 500, color: '#38bdf8' }}>wt% H₂O</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
              Ice Table Depth: <strong style={{ color: '#ffffff' }}>{assay.depthToIceTableCm} cm</strong> • Regolith Temp: <strong style={{ color: '#ffffff' }}>{assay.regolithTempK} K ({assay.regolithTempC}°C)</strong>
            </div>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '8px 14px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>VERIFIED RESEARCH DATA</div>
            <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
              LRO Diviner / LAMP / LCROSS
            </div>
          </div>
        </div>

        {/* Subsurface Geochemical Composition Breakdown */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600, marginBottom: '10px' }}>
            REGOLITH GEOCHEMICAL MASS FRACTION (SCIENTIFIC RESEARCH ASSAY)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {assay.geochemistry.map(item => (
              <div
                key={item.mineral}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#ffffff' }}>{item.mineral}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)' }}>{item.role}</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: item.mineral.includes('Water') ? '#38bdf8' : '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                  {item.wtPct}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Stratigraphy Layers */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, marginBottom: '8px' }}>
            0–100 CM CORE STRATIGRAPHY LOG
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {assay.stratigraphy.map(layer => (
              <div key={layer.depthRange} style={{ display: 'flex', alignItems: 'baseline', gap: '10px', fontSize: '11.5px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 600, width: '80px', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                  {layer.depthRange}
                </span>
                <span style={{ color: '#ffffff', fontWeight: 500, width: '130px', flexShrink: 0 }}>
                  {layer.horizon}:
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  {layer.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={() => {
              soundFX.playSuccessChime();
              onClose();
            }}
            style={{
              background: '#38bdf8',
              color: '#000000',
              fontWeight: 600,
              fontSize: '13px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Acknowledge & Close Assay Log
          </button>
        </div>
      </div>
    </div>
  );
}

