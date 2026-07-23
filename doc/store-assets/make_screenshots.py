"""
Store screenshot generator — Bonifatus.

Three-zone layout (all formats):
  Top  15 %  — purple brand header  → headline text
  Mid  70 %  — app screenshot        (fit-width or cover-scale, see below)
  Bot  15 %  — purple brand footer  → subline text
  8 % gradient blend at each zone boundary

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

PURPLE_MID  = (72, 56, 180)
WHITE       = (255, 255, 255)

# ─── Copy ────────────────────────────────────────────────────────────────────
# Parent: "your child / your children" → unambiguously the parent's view.
# Student: first-person action language → unambiguously the child's view.

PHONE_SCREENS = [
    # PARENT (5)
    dict(raw="p01_home.png",
         headline="See what your child\nearned this week.",
         subline=["Pending bonus points and grades —",
                  "your family's week at a glance."]),
    dict(raw="p02_children.png",
         headline="Every child.\nEvery pending point.",
         subline=["Grade counts and unsettled bonus points,",
                  "per child — always up to date."]),
    dict(raw="p03_child_detail.png",
         headline="54 bonus points.\nOne term.",
         subline=["Calculator grades totalled automatically,",
                  "broken down by semester."]),
    dict(raw="p04_test_reports.png",
         headline="Each test graded.\nEach point counted.",
         subline=["Grades logged by your child",
                  "appear here instantly."]),
    dict(raw="p05_settle.png",
         headline="Settle the reward\nwhen you're ready.",
         subline=["Review what was earned and pay it out",
                  "in one tap."]),
    # STUDENT (5)
    dict(raw="s01_home.png",
         headline="Log a grade.\nEarn bonus points.",
         subline=["See this week's total at a glance.",
                  "Your parent gets notified too."]),
    dict(raw="s02_notes.png",
         headline="Tap in your grade\nafter the test.",
         subline=["Your parent sees the bonus points",
                  "straight away."]),
    dict(raw="s03_calculator.png",
         headline="Know what you'll earn\nbefore the test.",
         subline=["Run the grade calculator.",
                  "No surprises on reward day."]),
    dict(raw="s04_insights.png",
         headline="Watch your points\ngrow over time.",
         subline=["Grade history and bonus point trend,",
                  "all in one place."]),
    dict(raw="s05_settings.png",
         headline="Your account,\nlinked to your parent.",
         subline=["One family account — what you log,",
                  "they see."]),
]

TABLET_SCREENS = [
    # PARENT (4)
    dict(raw="p01_home.png",
         headline="See what your child\nearned this week.",
         subline=["Pending bonus points and grades —",
                  "your family's week at a glance."]),
    dict(raw="p02_children.png",
         headline="Every child.\nEvery pending point.",
         subline=["Grade counts and unsettled bonus points,",
                  "per child — always up to date."]),
    dict(raw="p03_child_detail.png",
         headline="54 bonus points.\nOne term.",
         subline=["Calculator grades totalled automatically,",
                  "broken down by semester."]),
    dict(raw="p05_settle.png",
         headline="Settle the reward\nwhen you're ready.",
         subline=["Review what was earned and pay it out",
                  "in one tap."]),
    # STUDENT (3)
    dict(raw="s01_home.png",
         headline="Log a grade.\nEarn bonus points.",
         subline=["See this week's total at a glance.",
                  "Your parent gets notified too."]),
    dict(raw="s02_notes.png",
         headline="Tap in your grade\nafter the test.",
         subline=["Your parent sees the bonus points",
                  "straight away."]),
    dict(raw="s03_calculator.png",
         headline="Know what you'll earn\nbefore the test.",
         subline=["Run the grade calculator.",
                  "No surprises on reward day."]),
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


def purple_blend(canvas_w, canvas_h, y_start, blend_h, fade_in, max_alpha=235):
    img  = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r, g, b = PURPLE_MID
    for i in range(blend_h):
        t = i / max(blend_h - 1, 1)
        alpha = int(max_alpha * t) if fade_in else int(max_alpha * (1 - t))
        draw.line([(0, y_start + i), (canvas_w - 1, y_start + i)],
                  fill=(r, g, b, alpha))
    return img


def make_screenshot(cfg, raw_dir, status_bar, nav_bar,
                    out_path, canvas_w, canvas_h):
    src_path = os.path.join(raw_dir, cfg["raw"])
    if not os.path.exists(src_path):
        print(f"  [SKIP] {cfg['raw']} not found in {raw_dir}")
        return

    # ── Zones ─────────────────────────────────────────────────────────────
    HEADER_H = int(canvas_h * 0.15)
    FOOTER_H = int(canvas_h * 0.15)
    APP_H    = canvas_h - HEADER_H - FOOTER_H
    APP_Y    = HEADER_H
    FOOTER_Y = APP_Y + APP_H
    BLEND_H  = int(canvas_h * 0.08)

    # ── Source ─────────────────────────────────────────────────────────────
    src     = Image.open(src_path).convert("RGB")
    content = src.crop((0, status_bar, src.width, src.height - nav_bar))
    src_w, src_h = content.size

    # ── Scaling strategy ──────────────────────────────────────────────────
    # Portrait canvas + landscape source → cover-scale by height, left-crop
    # Everything else                    → fit-width, top-clip
    portrait_canvas  = canvas_h > canvas_w
    landscape_source = src_w > src_h

    if portrait_canvas and landscape_source:
        # Cover height: source fills APP_H exactly
        scale  = APP_H / src_h
        new_w  = int(src_w * scale)
        scaled = content.resize((new_w, APP_H), Image.LANCZOS)
        # Left-align: keep nav rail and primary content, drop empty right edge
        app_img = scaled.crop((0, 0, canvas_w, APP_H))
    else:
        # Fit width
        scale   = canvas_w / src_w
        new_h   = int(src_h * scale)
        scaled  = content.resize((canvas_w, new_h), Image.LANCZOS)
        crop_h  = min(new_h, APP_H)
        app_img = scaled.crop((0, 0, canvas_w, crop_h))
        if crop_h < APP_H:
            padded = Image.new("RGB", (canvas_w, APP_H), WHITE)
            padded.paste(app_img, (0, 0))
            app_img = padded

    # ── Compose ───────────────────────────────────────────────────────────
    canvas = Image.new("RGB", (canvas_w, canvas_h), PURPLE_MID)
    canvas.paste(app_img, (0, APP_Y))

    t_blend = purple_blend(canvas_w, canvas_h, APP_Y, BLEND_H, fade_in=False)
    canvas  = Image.alpha_composite(canvas.convert("RGBA"), t_blend).convert("RGB")

    b_blend = purple_blend(canvas_w, canvas_h, FOOTER_Y - BLEND_H, BLEND_H, fade_in=True)
    canvas  = Image.alpha_composite(canvas.convert("RGBA"), b_blend).convert("RGB")

    draw = ImageDraw.Draw(canvas)

    # ── Headline ──────────────────────────────────────────────────────────
    H_SZ    = int(canvas_w * 0.058)
    font_h  = load_font(H_SZ, bold=True)
    h_lines = cfg["headline"].split("\n")[:2]
    lh_h    = int(H_SZ * 1.28)
    total_h = len(h_lines) * lh_h
    y_h     = (HEADER_H - total_h) // 2

    for line in h_lines:
        bb = draw.textbbox((0, 0), line, font=font_h)
        x  = (canvas_w - (bb[2] - bb[0])) // 2
        draw.text((x + 2, y_h + 2), line, font=font_h, fill=(38, 28, 115))
        draw.text((x, y_h), line, font=font_h, fill=WHITE)
        y_h += lh_h

    # ── Subline ───────────────────────────────────────────────────────────
    S_SZ    = int(canvas_w * 0.034)
    font_s  = load_font(S_SZ, bold=False)
    s_lines = cfg["subline"][:3]
    lh_s    = int(S_SZ * 1.44)
    total_s = len(s_lines) * lh_s
    y_s     = FOOTER_Y + (FOOTER_H - total_s) // 2

    for line in s_lines:
        bb = draw.textbbox((0, 0), line, font=font_s)
        draw.text(((canvas_w - (bb[2] - bb[0])) // 2, y_s), line,
                  font=font_s, fill=WHITE)
        y_s += lh_s

    canvas.save(out_path, "PNG", optimize=True)
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
