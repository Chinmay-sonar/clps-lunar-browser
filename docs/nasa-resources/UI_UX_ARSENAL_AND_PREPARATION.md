# CODYSEEY CLPS Lunar Mission Browser - UI/UX Arsenal and Preparation Brief

> **Design Read:** "Reading this as: Immersive dark-tech 3D aerospace simulation for NASA mission planners and students, with a cinematic / cockpit-HUD language, leaning toward native CSS + GSAP + Three.js + premium display typography."

---

## Design Dials (from taste-skill)
```
DESIGN_VARIANCE: 9    (Asymmetric, cinematic, not templated)
MOTION_INTENSITY: 8   (Heavy GSAP timelines, scroll-driven, physics-based)
VISUAL_DENSITY: 6     (Data-rich HUD panels, but breathing with macro whitespace)
```

---

## 1. Skills Extracted from taste-skill Repo

We have fully absorbed and will enforce the following skills throughout the build:

### Core Skills
| Skill | File | Key Principles Extracted |
| :--- | :--- | :--- |
| **taste-skill (v2)** | `skills/taste-skill/SKILL.md` (88KB) | Anti-slop design philosophy. Brief inference before code. Three dials system. Anti-center bias. No default Inter/Roboto. No AI-purple gradients. No placeholder-as-label. Bento cell count rule. Section layout repetition ban. Eyebrow restraint (max 1 per 3 sections). Hero must fit initial viewport. Real images, not div-based fakes. |
| **soft-skill** | `skills/soft-skill/SKILL.md` (10KB) | $150K agency-level haptic depth. Double-bezel nested card architecture. Nested CTA pill buttons. Macro whitespace (`py-24` to `py-40`). Custom easing curves (never `linear` or `ease-in-out`). Diffused ambient shadows. Film-grain texture overlays. |
| **brandkit** | `skills/brandkit/SKILL.md` (16KB) | Premium brand-world generation. Dark charcoal canvas. Grid-based presentation boards. Restrained visual density. Cinematic atmosphere. Halftone/grain textures. |
| **redesign-skill** | `skills/redesign-skill/SKILL.md` (15KB) | Audit-first approach. Fix browser-default fonts. Introduce Medium (500) and SemiBold (600) weights. No pure `#000000` backgrounds. Tinted shadows. Tabular figures for data. |
| **minimalist-skill** | `skills/minimalist-skill/SKILL.md` (8KB) | When restraint is the design statement. Large negative space. Ultra-clean typography. |
| **image-to-code-skill** | `skills/image-to-code-skill/SKILL.md` (37KB) | Pixel-perfect reproduction from reference screenshots. |
| **imagegen-frontend-web** | `skills/imagegen-frontend-web/SKILL.md` (37KB) | AI image generation prompting for web section assets. |
| **output-skill** | `skills/output-skill/SKILL.md` (2KB) | Code output quality control. |

---

## 2. Animation and Motion Libraries Arsenal

| Library | Version | CDN / Install | Role in Our Project |
| :--- | :--- | :--- | :--- |
| **GSAP (GreenSock)** | 3.12+ | `npm i gsap` / `gsap.com` CDN | **Primary animation engine.** ScrollTrigger for scroll-driven reveals. Timeline sequences for cinematic page transitions. SplitText for character-level text reveals. Physics-based easing (`power4.out`, `elastic.out`, `back.out`). Pin-scrolling for the 3D horizon viewport. |
| **anime.js** | 4.x | `npm i animejs` / [animejs.com](https://animejs.com/) | **Secondary animation engine.** SVG path morphing for horizon silhouettes. Staggered particle animations. Timeline-based micro-interactions on HUD elements. Lightweight alternative for UI micro-animations. |
| **Motion (Framer Motion)** | Latest | `npm i motion` / `import { motion } from "motion/react"` | **React component animation.** Layout animations for panel transitions. AnimatePresence for mount/unmount animations. Gesture-driven interactions (drag, hover springs). useMotionValue for continuous pointer tracking. |
| **Lenis** | Latest | `npm i lenis` | **Smooth scroll engine.** Silky 60fps scroll interpolation. Integrates with GSAP ScrollTrigger. Prevents janky native scroll on data-heavy pages. |

### Animation Principles (from taste-skill + soft-skill)
- **NEVER** use `linear` or `ease-in-out` - use custom cubic-bezier or GSAP Power easing
- **Spring physics** for interactive elements: `stiffness: 400, damping: 30`
- **Stagger delays** for list/grid reveals: `0.04s-0.08s` per item
- **Scroll-driven parallax** on the 3D viewport and hero section
- **Text reveal** using GSAP SplitText: characters animate in with `y: 40, opacity: 0, rotateX: -90`
- **Magnetic hover** on navigation and CTA buttons using `useMotionValue` (NOT useState)
- **Page transitions** using GSAP timeline with clip-path reveals

---

## 3. Component and UI Sources

| Source | URL | What We Extract |
| :--- | :--- | :--- |
| **OriginKit** | [originkit.dev](https://www.originkit.dev) | Animated React components (particle effects, interactive backgrounds, glassmorphic cards). MCP integration for direct component fetching. |
| **21st.dev** | [21st.dev](https://21st.dev) | Premium React component registry. Bento grids, animated cards, text effects. AI-curated component search. |
| **Aceternity UI** | [ui.aceternity.com](https://ui.aceternity.com) | Spotlight effects, 3D card transforms, background beams, meteor lines, aurora backgrounds. |
| **Magic UI** | [magicui.design](https://magicui.design) | Animated borders, shimmer buttons, globe components, particle effects. |
| **React Bits** | [reactbits.dev](https://reactbits.dev) | Curated collection of production-ready animated components. |

---

## 4. Typography System

### Font Stack (Anti-Slop Selection)
```css
/* Display / Headlines - NOT Inter, NOT Roboto */
--font-display: 'Space Grotesk', 'Outfit', system-ui;

/* Body / UI - Clean geometric sans */  
--font-body: 'Geist', 'Satoshi', system-ui;

/* Mono / Data Telemetry - Mission control aesthetic */
--font-mono: 'JetBrains Mono', 'Geist Mono', monospace;

/* Accent / Labels - Tight tracking uppercase */
--font-label: 'Space Grotesk', var(--font-body);
```

### Typography Rules
- Headlines: `text-4xl md:text-6xl tracking-tighter leading-none font-semibold`
- Body: `text-base text-zinc-400 leading-relaxed max-w-[65ch]`
- Data values: `font-mono tabular-nums text-sm`
- Labels: `text-[11px] uppercase tracking-[0.15em] font-medium`
- Weight range: Regular (400), Medium (500), SemiBold (600), Bold (700)
- Tabular figures on ALL numeric displays: `font-variant-numeric: tabular-nums`

---

## 5. Color System (Aerospace Dark-Tech)

### Palette - NOT AI-Purple, NOT Generic Blue
```css
:root {
  /* Backgrounds - Deep space, not pure black */
  --bg-void:      #050508;     /* Deepest OLED black */
  --bg-primary:   #08090d;     /* Primary canvas */
  --bg-elevated:  #0f1117;     /* Cards, panels */
  --bg-surface:   #161a23;     /* Interactive surfaces */
  
  /* Accent - Electric Cyan (mission control) */
  --accent:       #00e5ff;     /* Primary accent */
  --accent-dim:   #00e5ff33;   /* Glow overlays */
  --accent-muted: #00e5ff15;   /* Subtle backgrounds */
  
  /* Signal Colors - Functional, not decorative */
  --solar-gold:   #ffd60a;     /* Sun / Power indicators */
  --earth-green:  #00ff87;     /* Earth / Comms online */
  --danger:       #ff3366;     /* Alerts / Shadow zones */
  --warning:      #ff9f1c;     /* Caution states */
  
  /* Text hierarchy */
  --text-primary:   #f0f2f5;   /* Headlines, primary content */
  --text-secondary: #8b95a5;   /* Body text, descriptions */
  --text-tertiary:  #4a5568;   /* Labels, metadata */
  
  /* Borders - Tinted, never pure gray */
  --border:       #ffffff0a;   /* Hairline structural */
  --border-hover: #ffffff15;   /* Interactive hover */
}
```

### Color Rules
- One accent color (electric cyan `#00e5ff`) locked across entire app
- Warm and cool grays are NOT mixed
- No purple/violet gradients anywhere (The Lila Rule)
- Signal colors (gold, green, red) are FUNCTIONAL, not decorative
- Shadows are always tinted to background hue, never pure black

---

## 6. Card and Surface Architecture (Double-Bezel System)

```css
/* Outer Shell */
.card-shell {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1.5rem;
  padding: 0.375rem;
}

/* Inner Core */
.card-core {
  background: var(--bg-elevated);
  border-radius: calc(1.5rem - 0.375rem);
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
}
```

---

## 7. OriginKit MCP Status

> [!IMPORTANT]
> The **OriginKit MCP server** is NOT currently connected in your Antigravity IDE. To use it, you need to:
> 1. Visit [originkit.dev](https://originkit.dev) and create a free account
> 2. Generate an API key (starts with `cmp_live_...`)
> 3. Add the MCP server to your `.gemini/config/mcp_config.json`:
> ```json
> {
>   "originkit": {
>     "url": "https://mcp.originkit.dev/sse",
>     "headers": {
>       "Authorization": "Bearer YOUR_API_KEY"
>     }
>   }
> }
> ```
> 4. Restart Antigravity IDE
>
> Once connected, I can run `originkit: get particle-saturn` to fetch the component directly.

---

## 8. Complete Updated Tech Stack

| Layer | Technology | Anti-Slop Enforcement |
| :--- | :--- | :--- |
| **Framework** | Vite + React 18 | No Next.js overhead for a simulation app |
| **3D Engine** | Three.js + WebGL | Custom shaders, not default materials |
| **Animation Primary** | GSAP + ScrollTrigger + SplitText | Timeline choreography, not CSS transitions |
| **Animation Secondary** | anime.js | SVG morphing, particle stagger effects |
| **Animation React** | Motion (Framer Motion) | Layout animations, gesture physics |
| **Smooth Scroll** | Lenis | Silk-smooth scroll interpolation |
| **Styling** | Vanilla CSS + CSS custom properties | NOT Tailwind. Native CSS gives maximum control over 3D viewport integration |
| **Icons** | Phosphor Icons (Light weight) | NOT Lucide (taste-skill discourages as default) |
| **Fonts** | Space Grotesk + Geist + JetBrains Mono | Self-hosted with @font-face + font-display: swap |
| **Export** | jsPDF + html2canvas | Client-side PDF mission briefs |
| **Hosting** | Vercel / GitHub Pages | Edge CDN, instant deploys |

---

## 9. Key Anti-Slop Rules We Will Enforce

1. **No centered hero unless it is a manifesto** - Our landing uses asymmetric split or full-bleed 3D viewport
2. **No AI-purple gradients** - Electric cyan + solar gold is our locked palette
3. **No Inter/Roboto** - Space Grotesk + Geist + JetBrains Mono
4. **No generic card grids** - Double-bezel nested architecture with breathing whitespace
5. **No ease-in-out transitions** - Custom cubic-bezier and GSAP Power easing only
6. **No placeholder images** - Generate real assets with image-gen tool
7. **No thick-stroke icons** - Phosphor Light weight only
8. **Max 1 eyebrow per 3 sections** - Restraint over repetition
9. **Hero fits initial viewport** - Headline max 2 lines, subtext max 20 words
10. **Mobile explicit** - Every multi-column layout declares its sub-768px fallback
