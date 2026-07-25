"""
Store screenshot generator — Bonifatus.

Three-zone layout (all formats):
  Top  18 %  — semi-transparent brand header  → headline text
  Mid  64 %  — app screenshot (full bleed, slight darkened edges)
  Bot  18 %  — semi-transparent brand footer  → subline text
  Smooth gradient blend from/into app content at each zone boundary

Design goals:
  - App content is the hero; text doesn't dominate
  - Dark semi-transparent overlay (not solid purple) so app shows through
  - Clean white headline, light grey subline
  - Role badge ("For parents" / "For students") bottom-left of header

Scaling strategy:
  • Phone sources (portrait 1080×2400) in portrait canvas  → fit-width, top-clip
  • Tablet sources (landscape 2560×1600) in portrait canvas → cover-height,
    crop from LEFT (preserves nav rail + main content, drops empty right margin)
  • Tablet sources in landscape canvas → fit-width, top-clip

Phone outputs  (raw/p*.png + raw/s*.png):
  ios_phone_65/    1284 × 2778   iPhone 6.5"
  ios_phone_69/    1320 × 2868   iPhone 6.9"
  android_phone/   1080 × 1920   Google Play phone

Tablet outputs  (raw_tablet/p*.png + raw_tablet/s*.png):
  ios_ipad_129/    2048 × 2732   iPad Pro 12.9"   (portrait, App Store required)
  android_tablet/  1920 × 1200   Google Play 10"  (landscape)
"""

from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(os.path.abspath(__file__))
RAW_PHONE  = os.path.join(BASE, "raw")
RAW_TABLET = os.path.join(BASE, "raw_tablet")

PHONE_SIZES = {
    "ios_phone_65":  (1284, 2778),
    "ios_phone_69":  (1320, 2868),
    "android_phone": (1080, 1920),
}
TABLET_SIZES = {
    "ios_ipad_129":   (2048, 2732),   # portrait
    "android_tablet": (1920, 1200),   # landscape
}

# Pixel 8 phone source (1080 × 2400)
PHONE_STATUS_BAR = 132
PHONE_NAV_BAR    = 203

# Lala_Tablet source (2560 × 1600)
TABLET_STATUS_BAR = 48
TABLET_NAV_BAR    = 55

# Brand palette
BRAND_DARK  = (20, 14, 60)    # very dark indigo — overlay colour
WHITE       = (255, 255, 255)
LIGHT_GREY  = (210, 208, 228) # subline text

# Role badge colours
BADGE_PARENT_BG  = (99, 80, 220)   # indigo
BADGE_STUDENT_BG = (16, 185, 129)  # emerald

# ─── Copy ────────────────────────────────────────────────────────────────────
# Parent: "your child / your children" → unambiguously the parent's view.
# Student: first-person action language → unambiguously the child's view.

PHONE_SCREENS = [
    # PARENT (5)
    dict(raw="p01_home.png",       role="parent",
         headline="See what your child\nearned this week.",
         subline="Pending bonus points and grades — your family's week at a glance."),
    dict(raw="p02_children.png",   role="parent",
         headline="Every child.\nEvery pending point.",
         subline="Grade counts and unsettled bonus points, per child — always up to date."),
    dict(raw="p03_child_detail.png", role="parent",
         headline="54 bonus points.\nOne term.",
         subline="Calculator grades totalled automatically, broken down by semester."),
    dict(raw="p04_test_reports.png", role="parent",
         headline="Each test graded.\nEach point counted.",
         subline="Grades logged by your child appear here instantly."),
    dict(raw="p05_settle.png",     role="parent",
         headline="Settle the reward\nwhen you're ready.",
         subline="Review what was earned and pay it out in one tap."),
    # STUDENT (5)
    dict(raw="s01_home.png",       role="student",
         headline="Log a grade.\nEarn bonus points.",
         subline="See this week's total at a glance. Your parent gets notified too."),
    dict(raw="s02_notes.png",      role="student",
         headline="Tap in your grade\nafter the test.",
         subline="Your parent sees the bonus points straight away."),
    dict(raw="s03_calculator.png", role="student",
         headline="Know what you'll earn\nbefore the test.",
         subline="Run the grade calculator. No surprises on reward day."),
    dict(raw="s04_insights.png",   role="student",
         headline="Watch your points\ngrow over time.",
         subline="Grade history and bonus point trend, all in one place."),
    dict(raw="s05_settings.png",   role="student",
         headline="Your account,\nlinked to your parent.",
         subline="One family account — what you log, they see."),
]

TABLET_SCREENS = [
    # PARENT (4)
    dict(raw="p01_home.png",       role="parent",
         headline="See what your child\nearned this week.",
         subline="Pending bonus points and grades — your family's week at a glance."),
    dict(raw="p02_children.png",   role="parent",
         headline="Every child.\nEvery pending point.",
         subline="Grade counts and unsettled bonus points, per child — always up to date."),
    dict(raw="p03_child_detail.png", role="parent",
         headline="54 bonus points.\nOne term.",
         subline="Calculator grades totalled automatically, broken down by semester."),
    dict(raw="p05_settle.png",     role="parent",
         headline="Settle the reward\nwhen you're ready.",
         subline="Review what was earned and pay it out in one tap."),
    # STUDENT (3)
    dict(raw="s01_home.png",       role="student",
         headline="Log a grade.\nEarn bonus points.",
         subline="See this week's total at a glance. Your parent gets notified too."),
    dict(raw="s02_notes.png",      role="student",
         headline="Tap in your grade\nafter the test.",
         subline="Your parent sees the bonus points straight away."),
    dict(raw="s03_calculator.png", role="student",
         headline="Know what you'll earn\nbefore the test.",
         subline="Run the grade calculator. No surprises on reward day."),
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    paths = (["C:/Windows/Fonts/arialbd.ttf",
               "C:/Windows/Fonts/calibrib.ttf",
               "C:/Windows/Fonts/verdanab.ttf"]
             if bold else
             ["C:/Windows/Fonts/arial.ttf",
               "C:/Windows/Fonts/calibri.ttf",
               "C:/Windows/Fonts/verdana.ttf"])
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_overlay(canvas_rgba, x0, y0, x1, y1, color_rgb, alpha):
    """Flat semi-transparent rectangle."""
    overlay = Image.new("RGBA", canvas_rgba.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle([x0, y0, x1, y1], fill=(*color_rgb, alpha))
    return Image.alpha_composite(canvas_rgba, overlay)


def draw_gradient_overlay(canvas_rgba, x0, y0, x1, y1, color_rgb,
                           alpha_start, alpha_end):
    """Vertical gradient overlay."""
    overlay = Image.new("RGBA", canvas_rgba.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    h = y1 - y0
    for i in range(h):
        t = i / max(h - 1, 1)
        a = int(alpha_start + (alpha_end - alpha_start) * t)
        draw.line([(x0, y0 + i), (x1, y0 + i)], fill=(*color_rgb, a))
    return Image.alpha_composite(canvas_rgba, overlay)


def wrap_text(text: str, font, max_width: int):
    """Wrap a single line of text to fit max_width pixels."""
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = f"{current} {word}".strip()
        bb = dummy.textbbox((0, 0), test, font=font)
        if bb[2] - bb[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def make_screenshot(cfg, raw_dir, status_bar, nav_bar,
                    out_path, canvas_w, canvas_h):
    src_path = os.path.join(raw_dir, cfg["raw"])
    if not os.path.exists(src_path):
        print(f"  [SKIP] {cfg['raw']} not found in {raw_dir}")
        return

    # ── Zones ─────────────────────────────────────────────────────────────
    HEADER_H = int(canvas_h * 0.18)
    FOOTER_H = int(canvas_h * 0.18)
    APP_H    = canvas_h - HEADER_H - FOOTER_H
    APP_Y    = HEADER_H
    FOOTER_Y = APP_Y + APP_H
    BLEND_H  = int(canvas_h * 0.09)   # gradient transition

    # ── Source ─────────────────────────────────────────────────────────────
    src     = Image.open(src_path).convert("RGB")
    content = src.crop((0, status_bar, src.width, src.height - nav_bar))
    src_w, src_h = content.size

    # ── Scaling strategy ──────────────────────────────────────────────────
    portrait_canvas  = canvas_h > canvas_w
    landscape_source = src_w > src_h

    if portrait_canvas and landscape_source:
        scale  = APP_H / src_h
        new_w  = int(src_w * scale)
        scaled = content.resize((new_w, APP_H), Image.LANCZOS)
        app_img = scaled.crop((0, 0, canvas_w, APP_H))
    else:
        scale   = canvas_w / src_w
        new_h   = int(src_h * scale)
        scaled  = content.resize((canvas_w, new_h), Image.LANCZOS)
        crop_h  = min(new_h, APP_H)
        app_img = scaled.crop((0, 0, canvas_w, crop_h))
        if crop_h < APP_H:
            padded = Image.new("RGB", (canvas_w, APP_H), (245, 245, 250))
            padded.paste(app_img, (0, 0))
            app_img = padded

    # ── Compose: app screenshot fills the content zone, bleeds under overlays
    full = Image.new("RGB", (canvas_w, canvas_h), BRAND_DARK)
    full.paste(app_img, (0, APP_Y))
    canvas = full.convert("RGBA")

    # ── Header overlay: solid at top, fades into app content ──────────────
    solid_end = HEADER_H - BLEND_H
    canvas = draw_overlay(canvas, 0, 0, canvas_w, solid_end, BRAND_DARK, 215)
    canvas = draw_gradient_overlay(canvas, 0, solid_end, canvas_w, HEADER_H,
                                   BRAND_DARK, 215, 0)

    # ── Footer overlay: fades from app content, solid at bottom ───────────
    canvas = draw_gradient_overlay(canvas, 0, FOOTER_Y, canvas_w, FOOTER_Y + BLEND_H,
                                   BRAND_DARK, 0, 215)
    canvas = draw_overlay(canvas, 0, FOOTER_Y + BLEND_H, canvas_w, canvas_h,
                          BRAND_DARK, 215)

    img = canvas.convert("RGB")
    draw = ImageDraw.Draw(img)

    MARGIN = int(canvas_w * 0.07)
    TEXT_W = canvas_w - 2 * MARGIN

    # ── Role badge ────────────────────────────────────────────────────────
    role      = cfg.get("role", "")
    badge_txt = "For parents" if role == "parent" else "For students"
    badge_rgb = BADGE_PARENT_BG if role == "parent" else BADGE_STUDENT_BG
    BADGE_SZ  = int(canvas_w * 0.028)
    font_badge = load_font(BADGE_SZ, bold=True)
    bb_b       = draw.textbbox((0, 0), badge_txt, font=font_badge)
    bw, bh     = bb_b[2] - bb_b[0], bb_b[3] - bb_b[1]
    PAD_X, PAD_Y = int(canvas_w * 0.022), int(canvas_w * 0.011)
    badge_x    = MARGIN
    badge_y    = int(canvas_h * 0.025)
    badge_r    = [badge_x, badge_y,
                  badge_x + bw + 2 * PAD_X, badge_y + bh + 2 * PAD_Y]
    # Rounded badge via RGBA layer
    badge_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge_layer)
    radius = (badge_r[3] - badge_r[1]) // 2
    bd.rounded_rectangle(badge_r, radius=radius, fill=(*badge_rgb, 230))
    img = Image.alpha_composite(img.convert("RGBA"), badge_layer).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw.text((badge_x + PAD_X, badge_y + PAD_Y), badge_txt,
              font=font_badge, fill=WHITE)

    # ── Headline ──────────────────────────────────────────────────────────
    H_SZ    = int(canvas_w * 0.056)
    font_h  = load_font(H_SZ, bold=True)
    h_lines = cfg["headline"].split("\n")[:2]
    lh_h    = int(H_SZ * 1.22)
    total_h = len(h_lines) * lh_h
    # Centre in solid header zone, below badge
    solid_top = badge_r[3] + int(canvas_h * 0.010)
    zone_h    = solid_end - solid_top
    y_h       = solid_top + max(0, (zone_h - total_h) // 2)

    for line in h_lines:
        bb = draw.textbbox((0, 0), line, font=font_h)
        tw = bb[2] - bb[0]
        x  = (canvas_w - tw) // 2
        draw.text((x + 2, y_h + 2), line, font=font_h, fill=(0, 0, 20))
        draw.text((x, y_h), line, font=font_h, fill=WHITE)
        y_h += lh_h

    # ── Subline ───────────────────────────────────────────────────────────
    S_SZ    = int(canvas_w * 0.029)
    font_s  = load_font(S_SZ, bold=False)
    s_lines = wrap_text(cfg["subline"], font_s, TEXT_W)
    lh_s    = int(S_SZ * 1.50)
    total_s = len(s_lines) * lh_s
    solid_start = FOOTER_Y + BLEND_H
    y_s = solid_start + max(0, (canvas_h - solid_start - total_s) // 2)

    for line in s_lines:
        bb = draw.textbbox((0, 0), line, font=font_s)
        tw = bb[2] - bb[0]
        draw.text(((canvas_w - tw) // 2, y_s), line, font=font_s, fill=LIGHT_GREY)
        y_s += lh_s

    img.save(out_path, "PNG", optimize=True)
    print(f"  {os.path.basename(out_path)}  {canvas_w}×{canvas_h}")


def run_set(screens, raw_dir, status_bar, nav_bar, sizes):
    tablet_raw_ok = (os.path.isdir(raw_dir) and
                     any(f.endswith(".png") for f in os.listdir(raw_dir)))
    if not tablet_raw_ok and raw_dir == RAW_TABLET:
        print(f"\n[skip] {raw_dir} has no PNGs.")
        return

    for size_key, (w, h) in sizes.items():
        out_dir = os.path.join(BASE, size_key)
        os.makedirs(out_dir, exist_ok=True)
        for f in os.listdir(out_dir):
            if f.endswith(".png"):
                os.remove(os.path.join(out_dir, f))
        print(f"\n── {size_key} ({w}×{h}) ──")
        for i, cfg in enumerate(screens, 1):
            prefix = "parent" if cfg["raw"].startswith("p") else "student"
            tag    = cfg["raw"].replace(".png", "").split("_", 1)[1]
            fname  = f"{i:02d}_{prefix}_{tag}.png"
            make_screenshot(cfg, raw_dir, status_bar, nav_bar,
                            os.path.join(out_dir, fname), w, h)


if __name__ == "__main__":
    # Remove old-named folders if they exist
    for old in ["ios_65", "ios_69", "android"]:
        old_path = os.path.join(BASE, old)
        if os.path.isdir(old_path):
            import shutil
            shutil.rmtree(old_path)
            print(f"Removed legacy folder: {old}")

    run_set(PHONE_SCREENS,  RAW_PHONE,  PHONE_STATUS_BAR,  PHONE_NAV_BAR,  PHONE_SIZES)
    run_set(TABLET_SCREENS, RAW_TABLET, TABLET_STATUS_BAR, TABLET_NAV_BAR, TABLET_SIZES)
    print("\nAll done.")
