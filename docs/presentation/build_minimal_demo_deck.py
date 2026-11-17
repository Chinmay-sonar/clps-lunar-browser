import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml import parse_xml

def build_refined_minimal_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Authentic Palette matching PPT Demo.pdf
    BG_BLACK = RGBColor(0, 0, 0)
    ACCENT_GOLD = RGBColor(202, 175, 137)  # Champagne Gold (#CAAF89)
    ACCENT_CYAN = RGBColor(56, 189, 248)  # Electric Blue accent
    TEXT_WHITE = RGBColor(255, 255, 255)
    TEXT_LIGHT_GRAY = RGBColor(226, 232, 240)
    TEXT_MUTED = RGBColor(160, 174, 192)
    BORDER_SUBTLE = RGBColor(45, 55, 72)

    # Assets
    base_dir = r"c:\Users\Asus\OneDrive\Desktop\The NASA Space App\Challenge 4\clps-lunar-browser"
    deck_assets = os.path.join(base_dir, "public", "deck_assets")
    bg_wave_path = os.path.join(deck_assets, "page_1_X4.png")
    header_logo_path = os.path.join(base_dir, "public", "assets", "codyseey_nasa_header_hd.png")
    
    user_media = r"C:\Users\Asus\.gemini\antigravity\brain\da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6\.user_uploaded"
    globe_img = os.path.join(user_media, "media_1794555879176_6f0d278d.jpg")
    lander_img = os.path.join(user_media, "media_1794588360797_d9683709.jpg")

    FONT_MAIN = "Google Sans"

    def apply_base_slide(slide):
        # 1. Solid Pure Black Base
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_BLACK
        bg.line.fill.background()

        # 2. Add the authentic fluid gradient wave from PPT Demo.pdf
        if os.path.exists(bg_wave_path):
            slide.shapes.add_picture(bg_wave_path, Inches(0), Inches(0), width=prs.slide_width, height=prs.slide_height)

        # 3. Add smooth cinematic fade transition
        try:
            trans_xml = parse_xml('<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" spd="med"><p:fade/></p:transition>')
            slide._element.append(trans_xml)
        except Exception:
            pass

    def add_demo_title(slide, title_text, left=Inches(0.9), top=Inches(0.65)):
        tb = slide.shapes.add_textbox(left, top, Inches(11), Inches(0.85))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title_text.upper()
        p.font.name = FONT_MAIN
        p.font.size = Pt(28)
        p.font.bold = False  # Pure clean non-bold aesthetic
        p.font.color.rgb = TEXT_WHITE

        # Champagne Gold underline
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top + Inches(0.62), Inches(0.85), Inches(0.025))
        line.fill.solid()
        line.fill.fore_color.rgb = ACCENT_GOLD
        line.line.fill.background()

    # ══════════════════════════════════════════════════════════════════════════
    # SLIDE 1: COVER SLIDE (HD Logo, Thinner Google Sans Title, Clean Timeline)
    # ══════════════════════════════════════════════════════════════════════════
    s1 = prs.slides.add_slide(blank_layout)
    apply_base_slide(s1)

    # Top-Left: High Definition Composite Logo (Codyseey | NASA Space Apps Challenge)
    if os.path.exists(header_logo_path):
        s1.shapes.add_picture(header_logo_path, Inches(0.9), Inches(0.65), height=Inches(0.48))

    # Top-Right: Arrow link
    tb_tr = s1.shapes.add_textbox(Inches(9.2), Inches(0.65), Inches(3.2), Inches(0.45))
    tf_tr = tb_tr.text_frame
    tf_tr.margin_left = tf_tr.margin_top = tf_tr.margin_right = tf_tr.margin_bottom = 0
    p_tr = tf_tr.paragraphs[0]
    p_tr.text = "CHALLENGE 4  ↗"
    p_tr.font.name = FONT_MAIN
    p_tr.font.size = Pt(13)
    p_tr.font.bold = False
    p_tr.font.color.rgb = TEXT_WHITE
    p_tr.alignment = PP_ALIGN.RIGHT

    # Center-Left: Big Display Title in THIN / REGULAR Google Sans (NOT bold)
    tb_main = s1.shapes.add_textbox(Inches(0.9), Inches(1.95), Inches(11.5), Inches(3.0))
    tf_main = tb_main.text_frame
    tf_main.word_wrap = True
    tf_main.margin_left = tf_main.margin_top = tf_main.margin_right = tf_main.margin_bottom = 0
    
    p_m1 = tf_main.paragraphs[0]
    p_m1.text = "CLPS LUNAR"
    p_m1.font.name = FONT_MAIN
    p_m1.font.size = Pt(58)
    p_m1.font.bold = False  # Thinner clean aesthetic as requested
    p_m1.font.color.rgb = TEXT_WHITE

    p_m2 = tf_main.add_paragraph()
    p_m2.text = "MISSION BROWSER"
    p_m2.font.name = FONT_MAIN
    p_m2.font.size = Pt(58)
    p_m2.font.bold = False  # Thinner clean aesthetic as requested
    p_m2.font.color.rgb = TEXT_WHITE

    p_sub = tf_main.add_paragraph()
    p_sub.text = "A Photorealistic 3D Digital Twin & Autonomous Mission Staging Platform for Artemis Polar Exploration"
    p_sub.font.name = FONT_MAIN
    p_sub.font.size = Pt(16)
    p_sub.font.bold = False
    p_sub.font.color.rgb = ACCENT_CYAN
    p_sub.space_before = Pt(14)

    # Lead Author
    p_author = tf_main.add_paragraph()
    r_by = p_author.add_run()
    r_by.text = "Project Lead & Architect: "
    r_by.font.name = FONT_MAIN
    r_by.font.size = Pt(13)
    r_by.font.color.rgb = TEXT_MUTED

    r_name = p_author.add_run()
    r_name.text = "Chinmay Sonar"
    r_name.font.name = FONT_MAIN
    r_name.font.size = Pt(14)
    r_name.font.bold = False
    r_name.font.color.rgb = TEXT_WHITE
    p_author.space_before = Pt(8)

    # BOTTOM: Sleek Minimal Roadmap Timeline Section
    timeline_top = Inches(5.85)
    
    track = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), timeline_top + Inches(0.18), Inches(11.5), Inches(0.015))
    track.fill.solid()
    track.fill.fore_color.rgb = BORDER_SUBTLE
    track.line.fill.background()

    roadmap_steps = [
        ("01", "The Problem", Inches(0.9)),
        ("02", "Solution: 3D Twin", Inches(3.2)),
        ("03", "NASA Datasets", Inches(5.5)),
        ("04", "Robotics & Egress", Inches(7.8)),
        ("05", "Predictive Engines", Inches(9.8)),
        ("06", "Mission Impact", Inches(11.4))
    ]

    for num, label, x_pos in roadmap_steps:
        dot = s1.shapes.add_shape(MSO_SHAPE.OVAL, x_pos, timeline_top + Inches(0.12), Inches(0.12), Inches(0.12))
        dot.fill.solid()
        dot.fill.fore_color.rgb = ACCENT_GOLD
        dot.line.fill.background()

        tb_step = s1.shapes.add_textbox(x_pos - Inches(0.1), timeline_top + Inches(0.32), Inches(1.8), Inches(0.65))
        tf_step = tb_step.text_frame
        tf_step.word_wrap = True
        tf_step.margin_left = tf_step.margin_top = tf_step.margin_right = tf_step.margin_bottom = 0
        
        p_s = tf_step.paragraphs[0]
        r_sn = p_s.add_run()
        r_sn.text = f"{num}\n"
        r_sn.font.name = FONT_MAIN
        r_sn.font.size = Pt(10)
        r_sn.font.bold = False
        r_sn.font.color.rgb = ACCENT_GOLD

        r_sl = p_s.add_run()
        r_sl.text = label
        r_sl.font.name = FONT_MAIN
        r_sl.font.size = Pt(11)
        r_sl.font.bold = False
        r_sl.font.color.rgb = TEXT_WHITE

    # ══════════════════════════════════════════════════════════════════════════
    # SLIDE 2: THE PROBLEM STATEMENT — ULTRA MINIMAL & ELEGANT (Executive Grade)
    # ══════════════════════════════════════════════════════════════════════════
    s2 = prs.slides.add_slide(blank_layout)
    apply_base_slide(s2)
    add_demo_title(s2, "The Problem Statement")

    # Official NASA Challenge 4 Directive (Clean, borderless, architectural)
    tb_q = s2.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(11.5), Inches(1.1))
    tf_q = tb_q.text_frame
    tf_q.word_wrap = True
    tf_q.margin_left = tf_q.margin_top = tf_q.margin_right = tf_q.margin_bottom = 0

    p_qlbl = tf_q.paragraphs[0]
    p_qlbl.text = "OFFICIAL NASA CHALLENGE 4 DIRECTIVE"
    p_qlbl.font.name = FONT_MAIN
    p_qlbl.font.size = Pt(10)
    p_qlbl.font.bold = False
    p_qlbl.font.color.rgb = ACCENT_GOLD

    p_qt = tf_q.add_paragraph()
    p_qt.text = '“Build an intuitive tool that lets mission planners, educators, and the public compare lunar South Pole landing sites and dates by visualizing Sun and Earth positions relative to the horizon, assessing solar power potential and direct-to-Earth communication windows.”'
    p_qt.font.name = FONT_MAIN
    p_qt.font.size = Pt(13)
    p_qt.font.bold = False
    p_qt.font.color.rgb = TEXT_WHITE
    p_qt.space_before = Pt(4)

    # Subtle horizontal hairline separator
    sep2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), Inches(2.95), Inches(11.5), Inches(0.012))
    sep2.fill.solid()
    sep2.fill.fore_color.rgb = BORDER_SUBTLE
    sep2.line.fill.background()

    # 3 Clean Minimal Columns (Floating on wave background, generous breathing room)
    prob_pillars = [
        ("01", "Extreme Grazing Sun",
         "The Sun skims the South Pole horizon at merely 1.5°–2.0°. A 2-meter rock casts shadows over 60 meters long, submerging crater rims into deep darkness and creating severe survival risks for solar-powered rovers."),

        ("02", "Cryogenic Cold Traps",
         "Permanently Shadowed Regions (PSRs) have remained in perpetual darkness for over 2 billion years below 40 K (-233°C), sheltering water-ice reserves while posing fatal risks of rover battery freeze-out."),

        ("03", "Fragmented Data Silos",
         "Crucial mission planning data is scattered across isolated repositories: LOLA altimetry, SPICE ephemerides, and optical GIS. Planners lacked a unified 3D engine to test landing, solar, and comms together.")
    ]

    pw = Inches(3.6)
    pgap = Inches(0.35)
    for idx, (num, h_text, b_text) in enumerate(prob_pillars):
        px = Inches(0.9) + idx * (pw + pgap)
        py = Inches(3.25)

        tb_p = s2.shapes.add_textbox(px, py, pw, Inches(3.8))
        tf_p = tb_p.text_frame
        tf_p.word_wrap = True
        tf_p.margin_left = tf_p.margin_top = tf_p.margin_right = tf_p.margin_bottom = 0

        p1 = tf_p.paragraphs[0]
        rn = p1.add_run()
        rn.text = f"{num}\n"
        rn.font.name = FONT_MAIN
        rn.font.size = Pt(30)
        rn.font.bold = False
        rn.font.color.rgb = ACCENT_GOLD

        rh = p1.add_run()
        rh.text = f"{h_text}\n"
        rh.font.name = FONT_MAIN
        rh.font.size = Pt(16)
        rh.font.bold = False
        rh.font.color.rgb = TEXT_WHITE

        p2 = tf_p.add_paragraph()
        p2.text = b_text
        p2.font.name = FONT_MAIN
        p2.font.size = Pt(12)
        p2.font.bold = False
        p2.font.color.rgb = TEXT_LIGHT_GRAY
        p2.space_before = Pt(10)

    # ══════════════════════════════════════════════════════════════════════════
    # SLIDE 3: INTRODUCTION & SOLUTION OVERVIEW (High-Contrast, Spacious)
    # ══════════════════════════════════════════════════════════════════════════
    s3 = prs.slides.add_slide(blank_layout)
    apply_base_slide(s3)
    add_demo_title(s3, "The Solution: Codyseey 3D Twin")

    # Left: High Resolution Screenshot of Interactive 3D Moon Globe
    if os.path.exists(globe_img):
        s3.shapes.add_picture(globe_img, Inches(0.9), Inches(1.65), width=Inches(5.6))

    # Right: Enhanced, High-Contrast Typography
    tb_intro = s3.shapes.add_textbox(Inches(6.8), Inches(1.65), Inches(5.6), Inches(5.2))
    tf_intro = tb_intro.text_frame
    tf_intro.word_wrap = True
    tf_intro.margin_left = tf_intro.margin_top = tf_intro.margin_right = tf_intro.margin_bottom = 0

    p_h = tf_intro.paragraphs[0]
    p_h.text = "A browser-native 3D digital twin connecting orbital reconnaissance, powered descent, and rover science."
    p_h.font.name = FONT_MAIN
    p_h.font.size = Pt(19)
    p_h.font.bold = False
    p_h.font.color.rgb = TEXT_WHITE

    intro_features = [
        ("Zero-Installation 60 FPS WebGL", "Runs seamlessly in modern browsers via Three.js with calibrated PBR Hapke and Lommel-Seeliger regolith scattering, accurately modeling opposition surges and micro-crater shadows."),
        ("Interactive 5-Phase Mission Lifecycle", "Guides users from selecting scientific objectives and 6 Artemis priority sites on a 3D Moon globe, through synodic time selection, to retro-propulsion touchdown and egress."),
        ("Multi-Vehicle Exploration Suite", "Supports the Astrobotic Griffin-1 lander, NASA VIPER, and Griffin Rover 2 robotics, alongside custom CAD model uploads (.GLB) for open-ended mission simulation.")
    ]

    for ftitle, fdesc in intro_features:
        p_ft = tf_intro.add_paragraph()
        p_ft.space_before = Pt(16)
        r_ft = p_ft.add_run()
        r_ft.text = f"• {ftitle}: "
        r_ft.font.name = FONT_MAIN
        r_ft.font.size = Pt(13)
        r_ft.font.bold = False
        r_ft.font.color.rgb = ACCENT_CYAN

        r_fd = p_ft.add_run()
        r_fd.text = fdesc
        r_fd.font.name = FONT_MAIN
        r_fd.font.size = Pt(12)
        r_fd.font.bold = False
        r_fd.font.color.rgb = TEXT_LIGHT_GRAY

    # ══════════════════════════════════════════════════════════════════════════
    # SLIDE 4: AUTHENTICATED NASA DATASETS — CLEAN 2x2 ARCHITECTURE
    # ══════════════════════════════════════════════════════════════════════════
    s4 = prs.slides.add_slide(blank_layout)
    apply_base_slide(s4)
    add_demo_title(s4, "Authenticated NASA Datasets")

    # Header directive
    tb_s4h = s4.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(11.5), Inches(0.45))
    tf_s4h = tb_s4h.text_frame
    tf_s4h.margin_left = tf_s4h.margin_top = tf_s4h.margin_right = tf_s4h.margin_bottom = 0
    p_s4h = tf_s4h.paragraphs[0]
    p_s4h.text = "FOUR OPEN-SCIENCE DATA PIPELINES INGESTED INTO THE CODYSEEY 3D CORE"
    p_s4h.font.name = FONT_MAIN
    p_s4h.font.size = Pt(10)
    p_s4h.font.bold = False
    p_s4h.font.color.rgb = ACCENT_GOLD

    # Separator hairline
    sep4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), Inches(2.05), Inches(11.5), Inches(0.012))
    sep4.fill.solid()
    sep4.fill.fore_color.rgb = BORDER_SUBTLE
    sep4.line.fill.background()

    nasa_datasets = [
        ("01", "LRO LOLA Altimetry (5m/px DEM)",
         "Authentic lunar South Pole topography from the Lunar Orbiter Laser Altimeter. Provides calibrated digital elevation grids for Malapert Massif, Shackleton, Mons Mouton, and Nobile to generate accurate 3D surface meshes.",
         "Official Portal: https://pds-geosciences.wustl.edu/missions/lro/lola.html"),

        ("02", "NASA NAIF SPICE Planetary Ephemeris",
         "Ingests JPL SPICE DE440 binary kernels computing high-precision sub-solar elevation vectors, sub-Earth libration angles (±6.7°), and line-of-sight Direct-to-Earth (DTE) communication visibility windows.",
         "Official Portal: https://naif.jpl.nasa.gov/pub/naif/generic_kernels/"),

        ("03", "LROC NAC & WAC Optical Imagery",
         "High-resolution 0.5 m/px Narrow Angle Camera DTMs and 100 m/px Wide Angle Camera global mosaics delivering ground-truth regolith albedo, micro-crater texturing, and Hapke reflectance calibration.",
         "Official Portal: https://quickmap.lroc.asu.edu/  •  https://wms.lroc.asu.edu/lroc/"),

        ("04", "Diviner Thermal & Neutron Spectrometry",
         "LRO Diviner cryogenic brightness temperature maps (<40 K to 390 K) and Lunar Prospector epithermal neutron counts utilized as multi-spectral ground truth to predict buried volatile deposits.",
         "Official Portal: https://www.diviner.ucla.edu/  •  https://pds-geosciences.wustl.edu/")
    ]

    for idx, (num, title, desc, url) in enumerate(nasa_datasets):
        col_x = Inches(0.9) if idx % 2 == 0 else Inches(6.9)
        row_y = Inches(2.35) if idx < 2 else Inches(4.75)
        cw = Inches(5.5)

        tb_box = s4.shapes.add_textbox(col_x, row_y, cw, Inches(2.1))
        tf_box = tb_box.text_frame
        tf_box.word_wrap = True
        tf_box.margin_left = tf_box.margin_top = tf_box.margin_right = tf_box.margin_bottom = 0

        p1 = tf_box.paragraphs[0]
        r_num = p1.add_run()
        r_num.text = f"{num}\n"
        r_num.font.name = FONT_MAIN
        r_num.font.size = Pt(22)
        r_num.font.bold = False
        r_num.font.color.rgb = ACCENT_GOLD

        r_title = p1.add_run()
        r_title.text = title
        r_title.font.name = FONT_MAIN
        r_title.font.size = Pt(15)
        r_title.font.bold = False
        r_title.font.color.rgb = TEXT_WHITE

        p2 = tf_box.add_paragraph()
        p2.text = desc
        p2.font.name = FONT_MAIN
        p2.font.size = Pt(11.5)
        p2.font.bold = False
        p2.font.color.rgb = TEXT_LIGHT_GRAY
        p2.space_before = Pt(8)

        p3 = tf_box.add_paragraph()
        p3.text = url
        p3.font.name = FONT_MAIN
        p3.font.size = Pt(10)
        p3.font.bold = False
        p3.font.color.rgb = ACCENT_CYAN
        p3.space_before = Pt(6)

    # ══════════════════════════════════════════════════════════════════════════
    # SLIDE 5: AEROSPACE ROBOTICS & EGRESS (Cinematic Shot + Deep Tech Specs)
    # ══════════════════════════════════════════════════════════════════════════
    s5 = prs.slides.add_slide(blank_layout)
    apply_base_slide(s5)
    add_demo_title(s5, "Aerospace Robotics & Egress")

    # Left: Cinematic High-Resolution Screenshot from Codyseey Solution
    cinematic_shot = os.path.join(deck_assets, "cinematic_rover_surface.png")
    if os.path.exists(cinematic_shot):
        s5.shapes.add_picture(cinematic_shot, Inches(0.9), Inches(1.75), width=Inches(5.5))
        
        # Elegant image caption
        tb_cap = s5.shapes.add_textbox(Inches(0.9), Inches(4.62), Inches(5.5), Inches(0.4))
        tf_cap = tb_cap.text_frame
        tf_cap.margin_left = tf_cap.margin_top = tf_cap.margin_right = tf_cap.margin_bottom = 0
        p_cap = tf_cap.paragraphs[0]
        p_cap.text = "Codyseey 3D Engine: VIPER Rover autonomous egress & real-time telemetry HUD"
        p_cap.font.name = FONT_MAIN
        p_cap.font.size = Pt(9.5)
        p_cap.font.bold = False
        p_cap.font.color.rgb = TEXT_MUTED

    # Right: Core Robotics, Egress Physics & Instrumentation
    tech_items = [
        ("01", "Astrobotic Griffin-1 Lander Architecture",
         "Primary NASA CLPS delivery craft with 475 kg payload mass. Features 7 throttling retro-propulsion thrusters, inertial touchdown guidance HUD, dual deployable carbon-composite egress ramps with dynamic slope safety interlocks, and steerable S-band high-gain phased-array comms."),

        ("02", "NASA VIPER & Polar Roving Robotics",
         "Polar rovers engineered with 4-wheel independent steering, active rocker-bogie chassis leveling across micro-craters, real-time stereo HazCam/NavCam Picture-in-Picture (PIP), and in-situ volatile prospecting via simulated NIRVSS infrared spectrometry & MSolo mass spectrometry."),

        ("03", "TRIDENT 1-Meter Rotary Core Drill",
         "Subsurface rotary-percussive drill capable of penetrating cryogenic regolith down to 100 cm depth. Simulates mechanical torque limits, permafrost extraction cycles, and in-situ mass spectrometry to quantify water-ice purity percentages.")
    ]

    ty = Inches(1.65)
    for num, heading, body in tech_items:
        tb_t = s5.shapes.add_textbox(Inches(6.8), ty, Inches(5.6), Inches(1.65))
        tf_t = tb_t.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0

        p1 = tf_t.paragraphs[0]
        rn = p1.add_run()
        rn.text = f"{num}  "
        rn.font.name = FONT_MAIN
        rn.font.size = Pt(16)
        rn.font.bold = False
        rn.font.color.rgb = ACCENT_GOLD

        rt = p1.add_run()
        rt.text = heading
        rt.font.name = FONT_MAIN
        rt.font.size = Pt(14)
        rt.font.bold = False
        rt.font.color.rgb = TEXT_WHITE

        p2 = tf_t.add_paragraph()
        p2.text = body
        p2.font.name = FONT_MAIN
        p2.font.size = Pt(11)
        p2.font.bold = False
        p2.font.color.rgb = TEXT_LIGHT_GRAY
        p2.space_before = Pt(6)

        ty += Inches(1.75)

    # ══════════════════════════════════════════════════════════════════════════
    # SLIDE 6: CORE PREDICTIVE ENGINES & ML ARCHITECTURE
    # ══════════════════════════════════════════════════════════════════════════
    s6 = prs.slides.add_slide(blank_layout)
    apply_base_slide(s6)
    add_demo_title(s6, "Predictive Engines & ML")

    # Header directive
    tb_s6h = s6.shapes.add_textbox(Inches(0.9), Inches(1.65), Inches(11.5), Inches(0.45))
    tf_s6h = tb_s6h.text_frame
    tf_s6h.margin_left = tf_s6h.margin_top = tf_s6h.margin_right = tf_s6h.margin_bottom = 0
    p_s6h = tf_s6h.paragraphs[0]
    p_s6h.text = "FOUR PHYSICS-BASED NUMERICAL ENGINES & MACHINE LEARNING ANALYTICS"
    p_s6h.font.name = FONT_MAIN
    p_s6h.font.size = Pt(10)
    p_s6h.font.bold = False
    p_s6h.font.color.rgb = ACCENT_GOLD

    # Hairline divider
    sep6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), Inches(2.05), Inches(11.5), Inches(0.012))
    sep6.fill.solid()
    sep6.fill.fore_color.rgb = BORDER_SUBTLE
    sep6.line.fill.background()

    s6_cards = [
        ("01", "Solar Grazing Horizon Ray-Tracer",
         "Simulates extreme 1.5°–2.0° grazing solar vectors across synodic lunation. Computes spherical-cap ray-surface intersections against local LOLA DEM topography to dynamically project 100km cast shadows and calculate instantaneous photovoltaic array power generation (Watts)."),

        ("02", "NAIF SPICE DE440 Comms & Libration Solver",
         "Ingests JPL SPICE DE440 ephemerides to compute high-precision Moon-Earth-Sun state vectors and ±6.7° lunar libration angles. Solves Direct-to-Earth (DTE) line-of-sight elevation over local crater rim elevation masks to secure high-bandwidth 100 Mbps telemetry margins."),

        ("03", "Diviner Cryogenic Cold-Trap & Volatiles ML",
         "Multi-parameter heuristic machine learning model trained on LRO Diviner cryogenic radiometer maps (<40 K to 110 K) and multi-year illumination grids. Accurately maps high-yield subsurface water-ice reservoirs (>30 wt%) inside Permanently Shadowed Regions (PSRs)."),

        ("04", "Modified Bekker Terramechanics & Slip Engine",
         "Implements Bekker-Wong soil mechanics for compressible lunar regolith, evaluating pressure-sinkage modulus, shear deformation, and wheel slippage. Triggers real-time collision alerts, wheel sinkage warnings, and rollover hazard alerts on steep inclines (>15°).")
    ]

    for idx, (num, ctitle, cdesc) in enumerate(s6_cards):
        gx = Inches(0.9) if idx % 2 == 0 else Inches(6.9)
        gy = Inches(2.35) if idx < 2 else Inches(4.75)
        gw = Inches(5.5)

        tb_c = s6.shapes.add_textbox(gx, gy, gw, Inches(2.1))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_top = tf_c.margin_right = tf_c.margin_bottom = 0

        p1 = tf_c.paragraphs[0]
        rn = p1.add_run()
        rn.text = f"{num}\n"
        rn.font.name = FONT_MAIN
        rn.font.size = Pt(22)
        rn.font.bold = False
        rn.font.color.rgb = ACCENT_GOLD

        rt = p1.add_run()
        rt.text = ctitle
        rt.font.name = FONT_MAIN
        rt.font.size = Pt(15)
        rt.font.bold = False
        rt.font.color.rgb = TEXT_WHITE

        p2 = tf_c.add_paragraph()
        p2.text = cdesc
        p2.font.name = FONT_MAIN
        p2.font.size = Pt(11.5)
        p2.font.bold = False
        p2.font.color.rgb = TEXT_LIGHT_GRAY
        p2.space_before = Pt(8)

    # ══════════════════════════════════════════════════════════════════════════
    # SLIDE 7: ARTEMIS IMPACT & TEAM (Spacious, High-Impact Closing Slide)
    # ══════════════════════════════════════════════════════════════════════════
    s7 = prs.slides.add_slide(blank_layout)
    apply_base_slide(s7)
    add_demo_title(s7, "Mission Impact & Team")

    # Left Column: Real-World Value (Spacious)
    tb_imp = s7.shapes.add_textbox(Inches(0.9), Inches(1.8), Inches(5.5), Inches(4.8))
    tf_imp = tb_imp.text_frame
    tf_imp.word_wrap = True
    tf_imp.margin_left = tf_imp.margin_top = tf_imp.margin_right = tf_imp.margin_bottom = 0

    p_ih = tf_imp.paragraphs[0]
    p_ih.text = "Paving the Way for Sustainable Lunar Exploration"
    p_ih.font.name = FONT_MAIN
    p_ih.font.size = Pt(18)
    p_ih.font.bold = False
    p_ih.font.color.rgb = TEXT_WHITE

    impact_points = [
        ("Accelerating CLPS Planning", "Reduces South Pole landing site hazard assessment and synodic solar window scheduling from weeks of manual scripting down to seconds of real-time browser interaction."),
        ("Mitigating Rover Survival Risk", "Prevents catastrophic battery freeze-out by pinpointing continuous illumination corridors across full synodic lunation cycles."),
        ("STEM Education & Open Science", "Demystifies the lunar South Pole for students, researchers, and space enthusiasts worldwide with 100% open-source accessibility.")
    ]

    for ititle, idesc in impact_points:
        p_pt = tf_imp.add_paragraph()
        p_pt.space_before = Pt(14)
        r1 = p_pt.add_run()
        r1.text = f"{ititle}\n"
        r1.font.name = FONT_MAIN
        r1.font.size = Pt(13)
        r1.font.bold = False
        r1.font.color.rgb = ACCENT_GOLD

        r2 = p_pt.add_run()
        r2.text = idesc
        r2.font.name = FONT_MAIN
        r2.font.size = Pt(11.5)
        r2.font.bold = False
        r2.font.color.rgb = TEXT_LIGHT_GRAY

    # Right Column: Project Metadata & Verification (Spacious)
    tb_team = s7.shapes.add_textbox(Inches(6.9), Inches(1.8), Inches(5.5), Inches(4.8))
    tf_team = tb_team.text_frame
    tf_team.word_wrap = True
    tf_team.margin_left = tf_team.margin_top = tf_team.margin_right = tf_team.margin_bottom = 0

    p_th = tf_team.paragraphs[0]
    p_th.text = "PROJECT METADATA & VERIFICATION"
    p_th.font.name = FONT_MAIN
    p_th.font.size = Pt(14)
    p_th.font.bold = False
    p_th.font.color.rgb = ACCENT_GOLD

    team_details = [
        ("Project Lead & Architecture", "Chinmay Sonar"),
        ("Challenge Track", "NASA Challenge 4: CLPS Lunar Mission Browser"),
        ("Live Simulation URL", "codyseeylunar.surge.sh"),
        ("Global Award Eligibility", "100% compliant with NASA Open Data & 7-Slide Rule"),
        ("Technology Stack", "React 18, Three.js (r160+), Vite, Python SPICE, WebGL PBR")
    ]

    for label, val in team_details:
        p_row = tf_team.add_paragraph()
        p_row.space_before = Pt(12)
        rl = p_row.add_run()
        rl.text = f"{label}\n"
        rl.font.name = FONT_MAIN
        rl.font.size = Pt(11)
        rl.font.bold = False
        rl.font.color.rgb = TEXT_MUTED

        rv = p_row.add_run()
        rv.text = val
        rv.font.name = FONT_MAIN
        rv.font.size = Pt(13.5)
        rv.font.bold = False
        rv.font.color.rgb = TEXT_WHITE

    # Save final presentation to all paths
    out_file = os.path.join(base_dir, "Codyseey_CLPS_Lunar_Mission_Browser_NASA_Space_Apps.pptx")
    prs.save(out_file)

    out_file_v2 = os.path.join(base_dir, "Codyseey_CLPS_Lunar_Mission_Browser_v2.pptx")
    prs.save(out_file_v2)

    out_file_final = os.path.join(base_dir, "Codyseey_CLPS_Lunar_Mission_Browser_Final.pptx")
    prs.save(out_file_final)

    # Mirror to Google Drive if available
    gdrive_dir = r"g:\My Drive\The Laptop Space\The NASA Space App\Challenge 4\clps-lunar-browser"
    if os.path.exists(gdrive_dir):
        try:
            prs.save(os.path.join(gdrive_dir, "Codyseey_CLPS_Lunar_Mission_Browser_Final.pptx"))
            print("Successfully mirrored to Google Drive Final!")
        except Exception as e:
            print("Google drive write notice:", e)

    print(f"Refined Deck saved successfully at: {out_file_final}")

if __name__ == "__main__":
    build_refined_minimal_deck()
