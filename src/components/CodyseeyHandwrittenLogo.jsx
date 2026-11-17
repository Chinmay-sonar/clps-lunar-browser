import React, { useState, useEffect, useId } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CODYSEEY HANDWRITTEN CURSIVE WORDMARK (DARK.AI GRADIENT EDITION)
 * ═══════════════════════════════════════════════════════════════════════════
 * - Porsche cursive wordmark from input_file_3.png
 * - Writes letter-by-letter as authentic handwriting
 * - Styled with the exact luxury golden + white + darker shade gradient
 *   from dark.ai "Coming Soon":
 *   linear-gradient(194.63deg, rgb(253, 252, 251) -20%, rgb(119, 106, 69) 140%)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export default function CodyseeyHandwrittenLogo({
  height = 105,
  stretch = 0.75, // Aspect ratio correction (removes over-stretched look, restoring elegant calligraphy proportions)
  duration = 2.4, // seconds to write the word
  delay = 0.2, // seconds before starting
  immediate = false, // When true, renders fully visible on frame 0 with zero draw delay
  onComplete,
  className = '',
  style = {}
}) {
  const [isFinished, setIsFinished] = useState(immediate);

  // Original uncorrected aspect ratio: 978w x 172h (~5.68 : 1)
  // Applying stretch factor (0.75) yields a balanced ~4.26 : 1 calligraphy aspect ratio
  const baseWidth = Math.round(height * (978 / 172));
  const finalWidth = Math.round(baseWidth * stretch);

  // The guide path tracking the ink centroids through the cursive letters "Codyseey"
  const strokePath =
    "M 10,104 L 30,99 L 50,90 L 70,82 L 90,75 L 110,70 L 130,66 L 150,62 L 170,58 L 190,55 " +
    "L 210,60 L 230,69 L 250,59 L 270,48 L 290,52 L 310,79 L 330,86 L 350,79 L 370,77 L 390,103 " +
    "L 410,104 L 430,96 L 450,85 L 470,71 L 490,70 L 510,78 L 530,72 L 550,81 L 570,78 L 590,71 " +
    "L 610,71 L 630,80 L 650,74 L 670,69 L 690,63 L 710,74 L 730,77 L 750,100 L 770,95 L 790,98 " +
    "L 810,91 L 830,79 L 850,77 L 870,73 L 890,63 L 910,66 L 930,75 L 950,73 L 970,71";

  const autoId = useId();
  const rawId = autoId.replace(/:/g, '') || 'codyseey';
  const maskId = `${rawId}-stroke-mask`;
  const logoMaskId = `${rawId}-logo-mask`;
  const gradId = `${rawId}-darkai-gold-grad`;

  useEffect(() => {
    if (immediate) {
      setIsFinished(true);
      if (onComplete) onComplete();
      return;
    }
    const finishTimer = setTimeout(() => {
      setIsFinished(true);
      if (onComplete) onComplete();
    }, (delay + duration) * 1000);

    return () => clearTimeout(finishTimer);
  }, [immediate, delay, duration, onComplete]);

  return (
    <div
      className={className}
      style={{
        display: 'inline-block',
        position: 'relative',
        width: `${finalWidth}px`,
        height: `${height}px`,
        userSelect: 'none',
        overflow: 'visible',
        ...style
      }}
    >
      <div
        style={{
          width: `${baseWidth}px`,
          height: `${height}px`,
          transformOrigin: 'left center',
          transform: `scaleX(${stretch})`,
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <svg
          viewBox="0 0 978 172"
          width={baseWidth}
          height={height}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            overflow: 'visible'
          }}
        >
        <defs>
          {/* Exact dark.ai Coming Soon gradient: silk warm-white -> champagne gold -> dark bronze gold */}
          <linearGradient id={gradId} x1="53.8%" y1="-20%" x2="46.2%" y2="140%">
            <stop offset="0%" stopColor="rgb(253, 252, 251)" />
            <stop offset="35%" stopColor="#f5ede0" />
            <stop offset="65%" stopColor="#cfc09f" />
            <stop offset="85%" stopColor="#9e8e63" />
            <stop offset="100%" stopColor="rgb(119, 106, 69)" />
          </linearGradient>

          {/* Progressive stroke sweep mask that uncovers the handwriting */}
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="978" height="172">
            <path
              d={strokePath}
              fill="none"
              stroke="#ffffff"
              strokeWidth="150"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1000"
              style={{
                strokeDasharray: '1000',
                strokeDashoffset: isFinished ? '0' : '1000',
                animation: isFinished
                  ? 'none'
                  : `codyseeyDrawStroke ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s forwards`
              }}
            />
          </mask>

          {/* Composite logo mask with handwriting progressive reveal */}
          <mask id={logoMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="978" height="172">
            <image
              href="/assets/codyseey-cursive.png"
              xlinkHref="/assets/codyseey-cursive.png"
              x="0"
              y="0"
              width="978"
              height="172"
              mask={isFinished ? undefined : `url(#${maskId})`}
            />
          </mask>
        </defs>

        {/* Cursive logo filled with exact dark.ai golden + white + darker shade gradient */}
        <rect
          x="0"
          y="0"
          width="978"
          height="172"
          fill={`url(#${gradId})`}
          mask={`url(#${logoMaskId})`}
        />
        </svg>
      </div>

      <style>{`
        @keyframes codyseeyDrawStroke {
          0% {
            stroke-dashoffset: 1000;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
