"""
German Play store screenshots (B7), rendered with the shared template in
doc/store-assets/make_screenshots.py.

Raw captures: screenshots-de/raw/ (Pixel_8_Phone, app language Deutsch, light mode,
store-review demo family Anna + Lena Becker on the dev database).
Output:       screenshots-de/android_phone/ (1080 x 1920, Google Play phone).

Layout: brand header with role badge, headline and subline; below it the app screen
(status and navigation bars cropped) in a rounded frame. Unlike the English template,
no caption is drawn over app content. Fonts and colours come from the shared template.

Captions 1-5 address parents (Sie), 6-8 the child (du), as in the app.
Run: python docs/store-listing/make_screenshots_de.py
"""
import importlib.util
import os

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
RAW = os.path.join(HERE, "screenshots-de", "raw")
OUT = os.path.join(HERE, "screenshots-de", "android_phone")

spec = importlib.util.spec_from_file_location(
    "make_screenshots", os.path.join(ROOT, "doc", "store-assets", "make_screenshots.py"))
template = importlib.util.module_from_spec(spec)
spec.loader.exec_module(template)

PARENT, CHILD = "Für Eltern", "Für Kinder"

SCREENS = [
    dict(raw="01_p01_home.png", role="parent", badge=PARENT,
         headline="Gute Noten.\nFaire Belohnung.",
         subline="Was Ihr Kind diese Woche verdient hat – auf einen Blick."),
    dict(raw="02_p03_child_detail.png", role="parent", badge=PARENT,
         headline="Jedes Zeugnis.\nJeder Punkt.",
         subline="Noten und Punkte pro Halbjahr, automatisch zusammengerechnet."),
    dict(raw="03_p_rule.png", role="parent", badge=PARENT,
         headline="Ihre Regel.\nEinmal festgelegt.",
         subline="Wie viele Punkte jede Note bringt – Sie legen es fest."),
    dict(raw="04_p05_settle.png", role="parent", badge=PARENT,
         headline="Belohnen,\nwann es passt.",
         subline="Offene Punkte prüfen und mit einem Tipp abrechnen."),
    dict(raw="05_p_invite.png", role="parent", badge=PARENT,
         headline="Kind einladen\nin einer Minute.",
         subline="QR-Code scannen oder Link schicken – fertig."),
    dict(raw="06_s_capture.png", role="student", badge=CHILD,
         headline="Zeugnis fotografieren.\nFertig.",
         subline="Die App erkennt die Noten, du bestätigst sie."),
    dict(raw="07_s_calc.png", role="student", badge=CHILD,
         headline="Notenrechner.\nVorher wissen, was es gibt.",
         subline="Punkte pro Fach ausrechnen, bevor das Zeugnis kommt."),
    dict(raw="08_s_insights.png", role="student", badge=CHILD,
         headline="Fortschritt\nsichtbar machen.",
         subline="Punkte Monat für Monat und deine Notenverteilung auf einen Blick."),
]

W, H = 1080, 1920
HEADER_H = 420
TOP_GRADIENT, BOTTOM_GRADIENT = (40, 28, 120), (79, 70, 229)


def background():
    bg = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(
            int(a + (b - a) * t) for a, b in zip(TOP_GRADIENT, BOTTOM_GRADIENT)))
    return bg


def render(cfg, out_path):
    img = background()
    d = ImageDraw.Draw(img)
    margin = 64

    # Role badge
    badge_rgb = template.BADGE_PARENT_BG if cfg["role"] == "parent" else template.BADGE_STUDENT_BG
    fb = template.load_font(30, bold=True)
    bx0, by0, bx1, by1 = d.textbbox((0, 0), cfg["badge"], font=fb)
    pad_x, pad_y = 22, 10
    x0, y0 = (W - (bx1 - bx0 + 2 * pad_x)) // 2, 44
    d.rounded_rectangle([x0, y0, x0 + bx1 - bx0 + 2 * pad_x, y0 + by1 + 2 * pad_y],
                        radius=(by1 + 2 * pad_y) // 2, fill=badge_rgb)
    d.text((x0 + pad_x, y0 + pad_y), cfg["badge"], font=fb, fill=template.WHITE)

    # Headline (max 2 lines, shrunk to fit) and subline
    size = 64
    lines = cfg["headline"].split("\n")[:2]
    while size > 40:
        fh = template.load_font(size, bold=True)
        if all(d.textbbox((0, 0), l, font=fh)[2] <= W - 2 * margin for l in lines):
            break
        size -= 2
    y = 120
    for line in lines:
        tw = d.textbbox((0, 0), line, font=fh)[2]
        d.text(((W - tw) // 2, y), line, font=fh, fill=template.WHITE)
        y += int(size * 1.18)
    fs = template.load_font(32)
    for line in template.wrap_text(cfg["subline"], fs, W - 2 * margin):
        tw = d.textbbox((0, 0), line, font=fs)[2]
        d.text(((W - tw) // 2, y + 14), line, font=fs, fill=template.LIGHT_GREY)
        y += 44

    # App screen: crop status and navigation bars, fit below the header, round the top
    src = Image.open(os.path.join(RAW, cfg["raw"])).convert("RGB")
    sw, sh = src.size
    src = src.crop((0, template.PHONE_STATUS_BAR, sw, sh - template.PHONE_NAV_BAR))
    top = max(HEADER_H, y + 40)
    target_h = H - top + 40
    scale = target_h / src.size[1]
    shot = src.resize((int(src.size[0] * scale), target_h), Image.LANCZOS)
    sx = (W - shot.size[0]) // 2
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, shot.size[0], shot.size[1] + 60], radius=36, fill=255)
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [sx - 4, top + 6, sx + shot.size[0] + 4, H + 60], radius=40, fill=(0, 0, 0, 110))
    img = Image.alpha_composite(img.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(14)))
    img.paste(shot, (sx, top), mask)
    img.convert("RGB").save(out_path, "PNG", optimize=True)
    print(f"  {os.path.basename(out_path)}  {W}x{H}")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for cfg in SCREENS:
        render(cfg, os.path.join(OUT, cfg["raw"]))
