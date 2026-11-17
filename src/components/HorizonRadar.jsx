import React, { useRef, useEffect } from 'react';

export default function HorizonRadar({ site, telemetry, isOpen, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas || !site || !telemetry) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    const padL = 28;
    const padR = 10;
    const padT = 12;
    const padB = 18;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const minElev = -2.5;
    const maxElev = 5.0;

    const mapX = (az) => padL + (az / 360) * plotW;
    const mapY = (el) => padT + (1 - (el - minElev) / (maxElev - minElev)) * plotH;

    // Zero plane baseline
    const zeroY = mapY(0);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(width - padR, zeroY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('0°', padL - 4, zeroY + 3);

    // Cardinal Markers
    [{ az: 0, l: 'N' }, { az: 90, l: 'E' }, { az: 180, l: 'S' }, { az: 270, l: 'W' }, { az: 360, l: 'N' }].forEach(c => {
      const x = mapX(c.az);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '8px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.l, x, height - 4);
    });

    // Topographic Ridge Silhouette
    const profile = site.horizonProfile;
    if (profile && profile.length > 0) {
      ctx.beginPath();
      ctx.moveTo(padL, height - padB);

      for (let az = 0; az <= 360; az++) {
        const h = profile[az % 360];
        const x = mapX(az);
        const y = mapY(h);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width - padR, height - padB);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();

      // Ridge stroke line
      ctx.beginPath();
      for (let az = 0; az <= 360; az++) {
        const h = profile[az % 360];
        const x = mapX(az);
        const y = mapY(h);
        if (az === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Sun point
    const sunX = mapX(telemetry.sun.azimuth);
    const sunY = mapY(telemetry.sun.elevation);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = telemetry.sun.isVisible ? '#f5c518' : '#f87171';
    ctx.fill();

    // Earth point
    const earthX = mapX(telemetry.earth.azimuth);
    const earthY = mapY(telemetry.earth.elevation);
    ctx.beginPath();
    ctx.arc(earthX, earthY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = telemetry.earth.isVisible ? '#34d399' : '#f87171';
    ctx.fill();

  }, [site, telemetry, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      bottom: '68px',
      left: '16px',
      width: '320px',
      padding: '10px 14px',
      zIndex: 35
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span className="sub-tag">HORIZON & HILLS</span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem' }}
        >
          ✕
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={290}
        height={75}
        style={{ width: '100%', height: '75px', display: 'block' }}
      />
    </div>
  );
}
