"""Vẽ logo app: SUV nhìn nghiêng, thân trắng, nóc đen (hình minh họa cách điệu, không phải logo VinFast).
Ra: icons/logo.svg, icons/icon-192.png, icons/icon-512.png"""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parent.parent
# Hình học xe (xe quay đầu sang phải), dùng chung cho SVG và PNG. Tâm xe ~ (120, 63).
BODY = [(20,86),(20,66),(24,58),(32,54),(60,50),(176,50),(200,56),(214,63),(220,72),(220,86)]
CABIN = [(52,50),(62,31),(70,23),(80,20),(140,20),(152,23),(166,31),(192,50)]
WIN_L = [(61,48),(70,29),(78,25),(104,25),(104,48)]
WIN_R = [(110,48),(110,25),(141,25),(148,27),(180,48)]
CLAD = [(20,79),(220,79),(220,86),(20,86)]          # ốp hông tối màu (dáng SUV)
MIRROR = [(150,46),(160,46),(160,51),(152,51)]
TAIL = [(20,58),(26,58),(26,70),(20,68)]
HEAD = [(205,60),(217,65),(219,70),(207,67)]
WHEELS = [(64,88),(176,88)]
DOOR = [((107,50),(107,79))]
CX, CY, CARW = 120, 63, 200
BG1, BG2 = "#0b5cff", "#6a3df0"
WR = [(21, "#0c0f16"), (18, "#171c25"), (10, "#d5dbe5"), (4, "#8b95a6")]  # arch, tire, rim, hub

def svg():
    pts = lambda p: " ".join(f"{x},{y}" for x, y in p)
    wheels = "".join("".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for r, c in WR) for x, y in WHEELS)
    car = (f'<ellipse cx="120" cy="107" rx="104" ry="5" fill="#000" opacity=".25"/>'
        f'<polygon points="{pts(BODY)}" fill="#fff" stroke="#c9d0dc" stroke-width="1.5" stroke-linejoin="round"/>'
        f'<polygon points="{pts(CLAD)}" fill="#2a303c"/>'
        f'<polygon points="{pts(CABIN)}" fill="#0b0d12" stroke="#0b0d12" stroke-width="2" stroke-linejoin="round"/>'
        f'<polygon points="{pts(WIN_L)}" fill="#3a4658"/><polygon points="{pts(WIN_R)}" fill="#3a4658"/>'
        f'<polygon points="{pts(MIRROR)}" fill="#0b0d12"/>'
        f'<line x1="107" y1="50" x2="107" y2="79" stroke="#d3d9e3" stroke-width="1.5"/>'
        f'<polygon points="{pts(TAIL)}" fill="#e5383b"/><polygon points="{pts(HEAD)}" fill="#ffe9a8"/>{wheels}')
    s = 0.54
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="VinFast VF 8 All New trắng nóc đen">'
        f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{BG1}"/><stop offset="1" stop-color="{BG2}"/></linearGradient></defs>'
        f'<rect width="128" height="128" rx="28" fill="url(#g)"/>'
        f'<g transform="translate({64 - CX * s} {64 - CY * s}) scale({s})">{car}</g></svg>')

def png(size):
    S = 4; n = size * S
    c1 = tuple(int(BG1[i:i+2], 16) for i in (1, 3, 5)); c2 = tuple(int(BG2[i:i+2], 16) for i in (1, 3, 5))
    im = Image.linear_gradient("L").resize((n, n)).rotate(45, resample=Image.BICUBIC, expand=False)
    base = Image.new("RGB", (n, n), c1); top = Image.new("RGB", (n, n), c2)
    im = Image.composite(top, base, Image.linear_gradient("L").resize((n, n)).transform((n, n), Image.AFFINE, (1, 0, 0, 1, 0, 0)))
    # gradient chéo: trộn theo (x+y)
    g = Image.new("L", (n, n)); gp = g.load()
    for y in range(n):
        for x in range(n): gp[x, y] = int(255 * (x + y) / (2 * n))
    im = Image.composite(top, base, g)
    d = ImageDraw.Draw(im)
    k = n * 0.74 / CARW
    ox, oy = n * 0.5 - CX * k, n * 0.5 - CY * k
    P = lambda p: [(ox + x * k, oy + y * k) for x, y in p]
    d.ellipse([ox + 16 * k, oy + 102 * k, ox + 224 * k, oy + 112 * k], fill=(10, 40, 130))
    d.polygon(P(BODY), fill="white", outline=(201, 208, 220))
    d.polygon(P(CLAD), fill=(42, 48, 60))
    d.polygon(P(CABIN), fill=(11, 13, 18))
    d.line(P(CABIN) + [P(CABIN)[0]], fill=(11, 13, 18), width=max(2, int(2 * k)), joint="curve")
    d.polygon(P(WIN_L), fill=(58, 70, 88)); d.polygon(P(WIN_R), fill=(58, 70, 88))
    d.polygon(P(MIRROR), fill=(11, 13, 18))
    for a, b in DOOR: d.line(P([a, b]), fill=(211, 217, 227), width=max(1, int(1.5 * k)))
    d.polygon(P(TAIL), fill=(229, 56, 59)); d.polygon(P(HEAD), fill=(255, 233, 168))
    for (x, y) in WHEELS:
        for r, col in WR:
            d.ellipse([ox + (x - r) * k, oy + (y - r) * k, ox + (x + r) * k, oy + (y + r) * k], fill=col)
    return im.resize((size, size), Image.LANCZOS)

(ROOT / "icons/logo.svg").write_text(svg(), encoding="utf8")
for s in (192, 512):
    png(s).save(ROOT / f"icons/icon-{s}.png")
print("ok")
