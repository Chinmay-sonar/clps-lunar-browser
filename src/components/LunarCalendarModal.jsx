import React, { useState, useMemo } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LUXURY LUNAR MISSION CALENDAR PICKER
 * ═══════════════════════════════════════════════════════════════════════════
 * - Locks all dates behind the current date (cannot select past dates).
 * - Previous month button locked when previous month is entirely in the past.
 * - Directly displayed inside Custom Date card with zero clutter.
 * - When user clicks a valid date, a circular white background black tick icon emerges.
 * - Clicking the circular white tick button locks & confirms the date,
 *   which unlocks the translunar trajectory calculation!
 */
export default function LunarCalendarModal({
  selectedDate,
  isConfirmed = false,
  onDatePendingChange,
  onConfirmDate
}) {
  // Current local reference date (normalized to midnight)
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const initialDate = useMemo(() => {
    if (selectedDate && isConfirmed) {
      const parts = selectedDate.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime()) && d.getTime() >= today.getTime()) return d;
      }
    }
    return today;
  }, [selectedDate, isConfirmed, today]);

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  // Date currently clicked in the calendar, awaiting confirmation via the circular tick button
  const [previewDateStr, setPreviewDateStr] = useState(() => {
    if (isConfirmed && selectedDate) {
      return selectedDate;
    }
    return null; // Starts clean with no selection until user clicks a date
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Lock navigating to past months
  const isPrevMonthLocked = useMemo(() => {
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0);
    return prevMonthLastDay.getTime() < today.getTime();
  }, [currentYear, currentMonth, today]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (isPrevMonthLocked) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Build days grid for currentMonth using local calendar calculation
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Parse preview date components
  const [previewYear, previewMonth, previewDay] = useMemo(() => {
    if (!previewDateStr) return [-1, -1, -1];
    const parts = previewDateStr.split('-').map(Number);
    return [parts[0], parts[1] - 1, parts[2]];
  }, [previewDateStr]);

  const handleDayClick = (day) => {
    const dateObj = new Date(currentYear, currentMonth, day);
    if (dateObj.getTime() < today.getTime()) return; // LOCKED: Past date!

    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const newStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    setPreviewDateStr(newStr);
    if (onDatePendingChange) {
      onDatePendingChange(newStr);
    }
  };

  const handleConfirmClick = (e) => {
    e.stopPropagation();
    if (!previewDateStr) return;
    if (onConfirmDate) onConfirmDate(previewDateStr);
  };

  const formattedPreviewDate = useMemo(() => {
    if (!previewDateStr) return '';
    const parts = previewDateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [previewDateStr]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        maxWidth: '330px',
        background: 'rgba(10, 14, 22, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '16px',
        padding: '16px 18px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        userSelect: 'none',
        fontFamily: "'Google Sans', 'Roboto', 'Inter', -apple-system, sans-serif",
        color: '#ffffff'
      }}
    >
      {/* ─── Header: <  Month | Year  > ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}
      >
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevMonthLocked}
          style={{
            background: 'none',
            border: 'none',
            color: isPrevMonthLocked ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.75)',
            cursor: isPrevMonthLocked ? 'not-allowed' : 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease'
          }}
          aria-label="Previous month"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
            {monthNames[currentMonth]}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '13px' }}>•</span>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff' }}>
            {currentYear}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.75)',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease'
          }}
          aria-label="Next month"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ─── Weekday Labels ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          marginBottom: '8px'
        }}
      >
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.4)'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* ─── Days Grid ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          rowGap: '5px',
          textAlign: 'center'
        }}
      >
        {/* Previous Month Dimmed Days */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => {
          const prevDay = daysInPrevMonth - firstDayOfWeek + i + 1;
          return (
            <div
              key={`prev-${i}`}
              style={{
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.15)',
                pointerEvents: 'none'
              }}
            >
              {prevDay}
            </div>
          );
        })}

        {/* Current Month Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateObj = new Date(currentYear, currentMonth, day);
          const isPastLocked = dateObj.getTime() < today.getTime(); // LOCKED PAST DATE
          const isSelected =
            currentYear === previewYear &&
            currentMonth === previewMonth &&
            day === previewDay;

          return (
            <div
              key={`day-${day}`}
              onClick={() => !isPastLocked && handleDayClick(day)}
              style={{
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPastLocked ? 'not-allowed' : 'pointer'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#000000' : isPastLocked ? 'rgba(255, 255, 255, 0.18)' : '#ffffff',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 12px rgba(255, 255, 255, 0.6)' : 'none',
                  opacity: isPastLocked ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isPastLocked) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isPastLocked) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {day}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── EMERGING CIRCULAR WHITE BACKGROUND BLACK TICK ICON ─── */}
      {previewDateStr && (
        <div style={{
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'tickContainerIn 0.25s cubic-bezier(0.16, 1.4, 0.3, 1) forwards'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isConfirmed && selectedDate === previewDateStr ? 'Date Confirmed' : 'Confirm Launch Date'}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', marginTop: '2px' }}>
              {formattedPreviewDate}
            </span>
          </div>

          {/* Circular White Background with Black Tick Icon Button */}
          <button
            type="button"
            onClick={handleConfirmClick}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.6)',
              transition: 'transform 0.18s cubic-bezier(0.16, 1.4, 0.3, 1), box-shadow 0.18s ease',
              animation: 'tickPopIn 0.3s cubic-bezier(0.16, 1.5, 0.3, 1) forwards'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 26px rgba(255, 255, 255, 0.75)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.6)';
            }}
            title="Click to Confirm Flight Date"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes tickPopIn {
          0% { transform: scale(0.3); opacity: 0; }
          70% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tickContainerIn {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
