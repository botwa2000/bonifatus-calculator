"""
Store screenshot generator — Bonifatus.

Layout (three-zone):
  Top  22 %  — solid purple brand colour  →  headline text
  Mid  48 %  — app screenshot (fit-width, top-cropped to zone height)
  Bot  30 %  — solid purple brand colour  →  subline text
  7 % gradient blend at each zone boundary (purple ↔ content).

Outputs:
  ios_65/   1284 × 2778   iPhone 6.5"
  ios_69/   1320 × 2868   iPhone 6.9"
  android/  1080 × 1920   Google Play
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

BASE = os.path.dirname(os.path.abspath(__file__))
RAW  = os.path.join(BASE, "raw")

SIZES = {
    "ios_65":  (1284, 2778),
    "ios_69":  (1320, 2868),
    "android": (1080, 1920),
}

# Pixel 8 emulator source dimensions (1080 × 2400 px)
STATUS_BAR = 132
NAV_BAR    = 203

PURPLE_MID  = (72,  56, 180)
WHITE       = (255, 255, 255)
INK         = (18,  18,  26)

SCREENS = [
    # ── PARENT ──────────────────────────────────────────────────────────────
    dict(raw="p01_home.png",
         headline="You're always\nin the loop.",
         subline=["Points to settle, pending grades —",
                  "your child's week in one screen."]),
    dict(raw="p02_children.png",
         headline="All your kids,\none screen.",
         subline=["Pending bonus points and grade counts",
                  "per child — always up to date."]),
    dict(raw="p03_child_detail.png",
         headline="Term results,\nno maths needed.",
         subline=["Calculator grades by semester,",
                  "bonus points already totalled."]),
    dict(raw="p04_test_reports.png",
         headline="Every test.\nEvery point.",
         subline=["Individual grades appear as your child",
                  "logs them — exact bonus points included."]),
    dict(raw="p05_settle.png",
         headline="Reward them\nwhen you're ready.",
         subline=["Review earned points and settle",
                  "the package in one tap."]),
    # ── STUDENT ─────────────────────────────────────────────────────────────
    dict(raw="s01_home.png",
         headline="Your grades.\nYour reward.",
         subline=["Every test you log earns bonus points —",
                  "see this week's total at a glance."]),
    dict(raw="s02_notes.png",
         headline="Log a grade\nin seconds.",
         subline=["Tap in your result after the test.",
                  "Your parent sees it straight away."]),
    dict(raw="s03_calculator.png",
         headline="Know your reward\nbefore the test.",
         subline=["Run the grade calculator — see exactly",
                  "how many bonus points a 1 or 3 earns."]),
    dict(raw="s04_insights.png",
         headline="Watch yourself\nimprove.",
         subline=["Your grade history and bonus points",
                  "over time — always up to date."]),
    dict(raw="s05_settings.png",
         headline="Linked with\nyour parent.",
         subline=["One family account — what you log",
                  "appears on your parent's dashboard."]),
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


def purple_blend(canvas_w: int, canvas_h: int,
                 y_start: int, blend_h: int,
                 fade_in: bool, max_alpha: int = 240) -> Image.Image:
    """
    RGBA overlay: a purple gradient band.
    fade_in=True  → transparent at y_start, solid at y_start+blend_h
    fade_in=False → solid at y_start, transparent at y_start+blend_h
    """
    img  = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r, g, b = PURPLE_MID
    for i in range(blend_h):
        t = i / blend_h
        alpha = int(max_alpha * t) if fade_in else int(max_alpha * (1 - t))
        draw.line([(0, y_start + i), (canvas_w - 1, y_start + i)],
                  fill=(r, g, b, alpha))
    return img


def make_screenshot(cfg: dict, out_path: str, canvas_w: int, canvas_h: int):
    # ── Zone geometry ──────────────────────────────────────────────────────
    HEADER_H = int(canvas_h * 0.22)          # solid purple + headline
    FOOTER_H = int(canvas_h * 0.30)          # solid purple + subline
    APP_H    = canvas_h - HEADER_H - FOOTER_H # mid content zone
    APP_Y    = HEADER_H
    FOOTER_Y = APP_Y + APP_H
    BLEND_H  = int(canvas_h * 0.07)          # gradient overlap into content zone

    # ── App screenshot ─────────────────────────────────────────────────────
    src     = Image.open(os.path.join(RAW, cfg["raw"])).convert("RGB")
    content = src.crop((0, STATUS_BAR, src.width, src.height - NAV_BAR))

    # Fit-width scale (never crops horizontally)
    scale   = canvas_w / content.width
    new_h   = int(content.height * scale)
    scaled  = content.resize((canvas_w, new_h), Image.LANCZOS)

    # Clip to app zone height (show top portion only)
    crop_h  = min(new_h, APP_H)
    app_img = scaled.crop((0, 0, canvas_w, crop_h))
    if crop_h < APP_H:
        # Pad short content with white (app background)
        padded = Image.new("RGB", (canvas_w, APP_H), WHITE)
        padded.paste(app_img, (0, 0))
        app_img = padded

    # ── Compose canvas ─────────────────────────────────────────────────────
    # Purple canvas; paste app content in mid zone
    canvas  = Image.new("RGB", (canvas_w, canvas_h), PURPLE_MID)
    canvas.paste(app_img, (0, APP_Y))

    # Blend gradient at top of content zone (purple → transparent)
    top_blend = purple_blend(canvas_w, canvas_h, APP_Y, BLEND_H, fade_in=False)
    canvas    = Image.alpha_composite(canvas.convert("RGBA"), top_blend).convert("RGB")

    # Blend gradient at bottom of content zone (transparent → purple)
    bot_blend = purple_blend(canvas_w, canvas_h, FOOTER_Y - BLEND_H, BLEND_H, fade_in=True)
    canvas    = Image.alpha_composite(canvas.convert("RGBA"), bot_blend).convert("RGB")

    draw = ImageDraw.Draw(canvas)

    # ── Headline (centred in header zone) ─────────────────────────────────
    H_SZ   = int(canvas_w * 0.092)
    font_h = load_font(H_SZ, bold=True)
    h_lines = cfg["headline"].split("\n")[:2]
    lh_h    = int(H_SZ * 1.28)
    total_h = len(h_lines) * lh_h
    y_h     = (HEADER_H - total_h) // 2

    for line in h_lines:
        bb = draw.textbbox((0, 0), line, font=font_h)
        tw = bb[2] - bb[0]
        x  = (canvas_w - tw) // 2
        # subtle dark shadow for depth
        draw.text((x + 2, y_h + 2), line, font=font_h,
                  fill=(40, 30, 120))
        draw.text((x, y_h), line, font=font_h, fill=WHITE)
        y_h += lh_h

    # ── Subline (centred in footer zone) ──────────────────────────────────
    S_SZ    = int(canvas_w * 0.050)
    font_s  = load_font(S_SZ, bold=False)
    s_lines = cfg["subline"][:3]
    lh_s    = int(S_SZ * 1.44)
    total_s = len(s_lines) * lh_s
    y_s     = FOOTER_Y + (FOOTER_H - total_s) // 2

    for line in s_lines:
        bb = draw.textbbox((0, 0), line, font=font_s)
        tw = bb[2] - bb[0]
        draw.text(((canvas_w - tw) // 2, y_s), line, font=font_s, fill=WHITE)
        y_s += lh_s

    canvas.save(out_path, "PNG", optimize=True)
    w, h = canvas.size
    print(f"  {os.path.basename(out_path)}  {w}×{h}")


def run():
    for store, (w, h) in SIZES.items():
        out_dir = os.path.join(BASE, store)
        os.makedirs(out_dir, exist_ok=True)
        print(f"\n── {store} ({w}×{h}) ──")
        for i, cfg in enumerate(SCREENS, 1):
            prefix = "parent" if cfg["raw"].startswith("p") else "student"
            tag    = cfg["raw"].replace(".png", "").split("_", 1)[1]
            fname  = f"{i:02d}_{prefix}_{tag}.png"
            make_screenshot(cfg, os.path.join(out_dir, fname), w, h)


if __name__ == "__main__":
    run()
    print("\nAll done.")
