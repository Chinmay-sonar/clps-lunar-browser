import React, { useState, useRef, useEffect } from 'react';
import { soundFX } from '../utils/soundFX';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM OBJECTIVE CAPSULE PILL INPUT (NATURAL FROSTED GLASS)
 * ═══════════════════════════════════════════════════════════════════════════
 * Natural frosted glass effect replacing orange borders:
 * - Ultra-clean backdrop blur (20px)
 * - Subtle silvery/white glass border with specular highlight
 * - Natural Google Sans / Inter typography
 * - Frosted microphone icon and liquid glass submit button (↑)
 * - Zero bright orange rings
 */
export default function CustomObjectivePillInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Specify your mission objective...'
}) {
  const [inputText, setInputText] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputText.trim()) {
      e.preventDefault();
      soundFX.playSuccessChime();
      if (onSubmit) onSubmit(inputText.trim());
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    soundFX.playSuccessChime();
    if (onSubmit) onSubmit(inputText.trim());
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: '999px',
        padding: '3px 4px',
        background: isFocused
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: isFocused
          ? '1px solid rgba(255, 255, 255, 0.35)'
          : '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: isFocused
          ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
          : '0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: 'stepFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      {/* Specular Edge Highlight Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Text Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value);
          if (onChange) onChange(e.target.value);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: '11px 18px',
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
          fontWeight: 400,
          letterSpacing: '-0.01em'
        }}
      />
    </div>
  );
}
