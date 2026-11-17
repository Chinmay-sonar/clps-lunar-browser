import React, { useState, useEffect, useRef } from 'react';
import { soundFX } from '../utils/soundFX';
import { LANDING_SITES } from '../data/landingSites';
import CodyseeyHandwrittenLogo from './CodyseeyHandwrittenLogo';
import { NasaSpaceAppsOfficialLogo, OriginalVerticalDivider } from './CodyseeyPreloaderHero';

/**
 * Pixel-Perfect Velora Navigation System for CODYSEEY Lunar Space Explorer
 * Matches Velora navigation styling verbatim:
 * - Font: Inter (400, 500)
 * - Pure Black Header: rgb(0, 0, 0)
 * - Capsule Pills: border-radius 32px, active background rgb(31, 31, 31)
 * - 860px 3-Column Floating Card: linear-gradient(180deg, rgb(0, 0, 0) 50%, rgb(13, 13, 13) 100%)
 * - 44x44px Icon Boxes: border 1px solid rgb(31, 31, 31), radius 8px
 * - Solid White Pill Action Button: rgb(253, 253, 253) with hover glow
 *
 * Content: Our actual space mission solution in the simplest, easiest plain English!
 * All lunar locations keep their exact official names (Malapert Massif, Shackleton, etc.)
 */
export default function Navbar({
  selectedSite,
  onSelectSite,
  currentSimDate,
  onOpenSiteSelector,
  onExportBrief,
  onOpenOptimizer,
  isOptimizerOpen,
  isRadarOpen,
  setIsRadarOpen,
  onOpenAnalytics,
  isAnalyticsOpen,
  onOpenTraversePlanner,
  isTraverseOpen,
  cameraMode,
  setCameraMode,
  viewMode,
  setViewMode,
  activeVehicle = 'viper',
  onOpenOrbitalRecon,
  isOrbitalReconOpen,
  onOpenTerminalDescent,
  isTerminalDescentOpen,
  onOpenSiteMatrix,
  isSiteMatrixOpen,
  onOpenManifest,
  isGuidanceOpen,
  setIsGuidanceOpen,
  onOpenClpsDeliveries,
  onReturnToBriefing,
  activeMineralTarget,
  onOpenStaging
}) {
  // Active Dropdown: 'views' | 'sites' | 'tools' | null
  const [activeMenu, setActiveMenu] = useState(null);
  const [hoveredNav, setHoveredNav] = useState(null);
  const navRef = useRef(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavClick = (menuId) => {
    soundFX.playClick();
    setActiveMenu((prev) => (prev === menuId ? null : menuId));
  };

  const handleNavHover = (menuId) => {
    setHoveredNav(menuId);
    if (activeMenu !== null && activeMenu !== menuId) {
      setActiveMenu(menuId);
    }
  };

  const pickSite = (siteId) => {
    soundFX.playClick();
    const found = LANDING_SITES.find((s) => s.id === siteId);
    if (found && onSelectSite) {
      onSelectSite(found);
    }
    setActiveMenu(null);
  };

  return (
    <header
      ref={navRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'rgb(0, 0, 0)',
        borderBottom: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        {/* ─── 1. MISSION BRAND LOGO & BRIEFING RETURN ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            onClick={() => {
              soundFX.playClick();
              if (onReturnToBriefing) onReturnToBriefing();
              else if (setCameraMode) setCameraMode('orbital');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            title="CODYSEEY // NASA Space Apps Challenge 2026"
          >
            <CodyseeyHandwrittenLogo
              height={26}
              stretch={0.75}
              immediate={true}
            />
            <OriginalVerticalDivider
              height={20}
              visible={true}
            />
            <NasaSpaceAppsOfficialLogo
              height={32}
            />
          </div>
        </div>

        {/* ─── 2. CENTER PILL NAV LINKS (All in ONE single horizontal line) ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
          <NavPill
            label="Change Lunar Site"
            hasChevron={false}
            isOpen={false}
            onClick={() => {
              soundFX.playClick();
              if (onOpenStaging) onOpenStaging(1);
              else if (onOpenSiteSelector) onOpenSiteSelector();
              setActiveMenu(null);
            }}
            onMouseEnter={() => setHoveredNav('change-site')}
          />

          <NavPill
            label="Change Rover"
            hasChevron={false}
            isOpen={false}
            onClick={() => {
              soundFX.playClick();
              if (onOpenStaging) onOpenStaging(2);
              setActiveMenu(null);
            }}
            onMouseEnter={() => setHoveredNav('change-rover')}
          />

          <NavPill
            label="Views"
            hasChevron={true}
            isOpen={activeMenu === 'views'}
            onClick={() => handleNavClick('views')}
            onMouseEnter={() => handleNavHover('views')}
          />

          <NavPill
            label="Moon Sites"
            hasChevron={true}
            isOpen={activeMenu === 'sites'}
            onClick={() => handleNavClick('sites')}
            onMouseEnter={() => handleNavHover('sites')}
          />

          <NavPill
            label="Tools"
            hasChevron={true}
            isOpen={activeMenu === 'tools'}
            onClick={() => handleNavClick('tools')}
            onMouseEnter={() => handleNavHover('tools')}
          />

          <NavPill
            label="CLPS Deliveries"
            hasChevron={false}
            isOpen={false}
            onClick={() => {
              soundFX.playClick();
              if (onOpenClpsDeliveries) onOpenClpsDeliveries();
              setActiveMenu(null);
            }}
            onMouseEnter={() => setHoveredNav('clps')}
          />

          <NavPill
            label="Guide"
            hasChevron={false}
            isOpen={isGuidanceOpen}
            onClick={() => {
              soundFX.playClick();
              if (setIsGuidanceOpen) setIsGuidanceOpen(!isGuidanceOpen);
              setActiveMenu(null);
            }}
            onMouseEnter={() => setHoveredNav('guide')}
          />
        </div>

        {/* ─── 3. RIGHT NAVIGATION (Guide & White Pill Action) ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => {
              soundFX.playClick();
              if (onOpenManifest) onOpenManifest();
              setActiveMenu(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgb(139, 139, 139)',
              fontSize: '14px',
              fontWeight: 400,
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgb(253, 253, 253)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgb(139, 139, 139)';
            }}
          >
            Mission Info
          </button>

          {/* Exact Solid White Pill Button from Velora */}
          <button
            onClick={() => {
              soundFX.playClick();
              if (onExportBrief) onExportBrief();
            }}
            style={{
              background: 'rgb(253, 253, 253)',
              color: 'rgb(0, 0, 0)',
              border: 'none',
              borderRadius: '32px',
              padding: '6px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(253, 253, 253, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Save complete Moon mission report as PDF"
          >
            Save Report
          </button>
        </div>

        {/* ─── 4. EXACT VELORA 3-COLUMN FLOATING MEGA MENU CARD (860px) ─── */}
        {activeMenu && (
          <div
            style={{
              position: 'absolute',
              top: '72px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '860px',
              maxWidth: 'calc(100vw - 40px)',
              background: 'linear-gradient(180deg, rgb(0, 0, 0) 50%, rgb(13, 13, 13) 100%)',
              border: '2px solid rgb(31, 31, 31)',
              borderRadius: '24px',
              boxShadow: '0 32px 80px rgba(0, 0, 0, 0.85)',
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '24px',
              zIndex: 110,
              boxSizing: 'border-box',
              animation: 'veloraFadeDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {/* ══════════════════════════════════════════════════════════
                CARD 1: VIEWS (Easy, Simple Words)
                ══════════════════════════════════════════════════════════ */}
            {activeMenu === 'views' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    Main Views
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Mission Staging"
                      desc="Select landing site, vehicle & mission target"
                      icon={<GlobeIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenStaging) onOpenStaging();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Moon Surface"
                      desc="Walk and drive on the landing area"
                      icon={<MountainIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        setViewMode('3d');
                        setCameraMode('surface');
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Moon Map"
                      desc="See hills and elevation map"
                      icon={<MapIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        setViewMode('gis');
                        setActiveMenu(null);
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    Camera Angles
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Look Around"
                      desc="Free view of the landing area"
                      icon={<TelescopeIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        setViewMode('3d');
                        setCameraMode('surface');
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Rover Camera"
                      desc="Follow behind the rover"
                      icon={<RoverIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        setViewMode('3d');
                        setCameraMode('rover');
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Driver View"
                      desc="Look out the front window"
                      icon={<JoystickIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        setViewMode('3d');
                        setCameraMode('cockpit');
                        setActiveMenu(null);
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    Helpful Displays
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Radar & Hills"
                      desc="See nearby hills and sun direction"
                      icon={<RadarIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        setIsRadarOpen(!isRadarOpen);
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Solar Power"
                      desc="Best angle for solar panels"
                      icon={<SunIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenOptimizer) onOpenOptimizer();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Mission Tips"
                      desc="Helpful tips for your mission"
                      icon={<BookIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (setIsGuidanceOpen) setIsGuidanceOpen(!isGuidanceOpen);
                        setActiveMenu(null);
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════
                CARD 2: MOON SITES (Official Lunar Names Kept Exactly)
                ══════════════════════════════════════════════════════════ */}
            {activeMenu === 'sites' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    South Pole Sites
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Malapert Massif"
                      desc="High mountain with steady sunlight"
                      icon={<MountainIcon />}
                      onClick={() => pickSite('malapert-massif')}
                    />
                    <MenuCard
                      title="Shackleton Connecting Ridge"
                      desc="Narrow ridge near a deep dark crater"
                      icon={<RouteIcon />}
                      onClick={() => pickSite('shackleton-connecting-ridge')}
                    />
                    <MenuCard
                      title="Mons Mouton"
                      desc="Large flat plateau for exploration"
                      icon={<MapIcon />}
                      onClick={() => pickSite('mons-mouton')}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    Crater Rims
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Nobile Rim"
                      desc="Rolling hills with ice in dark spots"
                      icon={<GlobeIcon />}
                      onClick={() => pickSite('nobile-rim-1')}
                    />
                    <MenuCard
                      title="de Gerlache Rim"
                      desc="Crater edge with bright sun peaks"
                      icon={<SunIcon />}
                      onClick={() => pickSite('de-gerlache-rim')}
                    />
                    <MenuCard
                      title="Haworth Rim"
                      desc="High ridge near ice cold traps"
                      icon={<TelescopeIcon />}
                      onClick={() => pickSite('haworth-rim')}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    Site Tools
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Compare Sites"
                      desc="See all landing sites side by side"
                      icon={<ChartIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenSiteMatrix) onOpenSiteMatrix();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="All Locations"
                      desc="Pick any site on the Moon map"
                      icon={<MapIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenSiteSelector) onOpenSiteSelector();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Landing Guide"
                      desc="Learn where and why we land here"
                      icon={<BookIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenManifest) onOpenManifest();
                        setActiveMenu(null);
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════
                CARD 3: TOOLS (Plain, Easy English)
                ══════════════════════════════════════════════════════════ */}
            {activeMenu === 'tools' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    Planning Tools
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Drive Planner"
                      desc="Plan safe driving routes in sunlight"
                      icon={<RouteIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenTraversePlanner) onOpenTraversePlanner();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Landing Path"
                      desc="Step-by-step descent to the surface"
                      icon={<LanderIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenTerminalDescent) onOpenTerminalDescent();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Rover Cargo"
                      desc="Check science instruments on board"
                      icon={<BoxIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenManifest) onOpenManifest();
                        setActiveMenu(null);
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    Rover Equipment
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Solar Angle"
                      desc="Point panels towards the Sun"
                      icon={<SunIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenOptimizer) onOpenOptimizer();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Headlights"
                      desc="Bright lights to see in dark craters"
                      icon={<SunIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Ice Drill"
                      desc="TRIDENT drill for finding water ice"
                      icon={<RouteIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        setActiveMenu(null);
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 400, color: '#777777' }}>
                    Reports & Data
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <MenuCard
                      title="Mission Numbers"
                      desc="Live temperature, height, and power"
                      icon={<ChartIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenAnalytics) onOpenAnalytics();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Save Report"
                      desc="Download a complete mission summary"
                      icon={<FileTextIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onExportBrief) onExportBrief();
                        setActiveMenu(null);
                      }}
                    />
                    <MenuCard
                      title="Earth Signal"
                      desc="Check connection back to Earth"
                      icon={<GlobeIcon />}
                      onClick={() => {
                        soundFX.playClick();
                        if (onOpenOrbitalRecon) onOpenOrbitalRecon();
                        setActiveMenu(null);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes veloraFadeDown {
          from {
            opacity: 0;
            transform: translate(-50%, -6px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </header>
  );
}

/**
 * Exact Velora NavPill Component
 * Default: color rgb(139, 139, 139), background transparent
 * Hover: color rgb(253, 253, 253)
 * Active: background rgb(31, 31, 31), color rgb(253, 253, 253), border-radius 32px
 */
function NavPill({ label, hasChevron, isOpen, onClick, onMouseEnter }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (onMouseEnter) onMouseEnter();
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: hasChevron ? '6px 8px 6px 13px' : '6px 13px',
        background: isOpen ? 'rgb(31, 31, 31)' : 'transparent',
        color: isOpen || isHovered ? 'rgb(253, 253, 253)' : 'rgb(139, 139, 139)',
        border: 'none',
        borderRadius: '32px',
        fontSize: '14px',
        fontWeight: 400,
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        lineHeight: '1.6em',
        height: '34px',
        transition: 'all 0.15s ease'
      }}
    >
      <span>{label}</span>
      {hasChevron && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </button>
  );
}

/**
 * Exact Velora Card Component
 * Width: 100%, Height: 44px
 * Icon: 44x44px box, border-radius 8px, border 1px solid rgb(31, 31, 31)
 * Title: 14px rgb(253, 253, 253)
 * Description: 12px rgb(139, 139, 139)
 */
function MenuCard({ icon, title, desc, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        textDecoration: 'none',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* 44x44 Icon Container with 8px radius */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          border: '1px solid rgb(31, 31, 31)',
          backgroundColor: isHovered ? 'rgb(31, 31, 31)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isHovered ? 'rgb(253, 253, 253)' : 'rgb(139, 139, 139)',
          flexShrink: 0,
          transition: 'all 0.15s ease'
        }}
      >
        {icon}
      </div>

      {/* Title & Description in Plain English */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 400,
            color: 'rgb(253, 253, 253)',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 400,
            color: 'rgb(139, 139, 139)',
            fontFamily: "'Inter', sans-serif",
            lineHeight: '1.6em'
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

// ─── MINIMALIST 24x24 LINE ICONS (matching Velora stroke 1.5) ───

function GlobeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20L15 4l-4 7-2.5-4z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function TelescopeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4.5l1.5-1.5L21 12.5 19.5 14z" />
      <path d="M5.5 9L4 10.5 13.5 20l1.5-1.5z" />
      <line x1="14" y1="14.5" x2="19.5" y2="20" />
      <line x1="14.5" y1="14" x2="9" y2="19.5" />
    </svg>
  );
}

function RoverIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="8" width="14" height="6" rx="2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
    </svg>
  );
}

function JoystickIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="12" x2="12" y2="3" />
      <circle cx="12" cy="3" r="2" />
      <rect x="4" y="12" width="16" height="8" rx="2" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <line x1="12" y1="12" x2="19" y2="5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

function LanderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="8" rx="2" />
      <line x1="6" y1="14" x2="3" y2="20" />
      <line x1="18" y1="14" x2="21" y2="20" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
