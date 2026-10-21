"""Tạo icon app từ ảnh xe của người dùng (tools/assets/car.png) + ảnh nền hero (img/interior.jpg).
Ra: icons/icon-192.png, icons/icon-512.png, icons/logo.png, img/interior.jpg"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
ROOT = Path(__file__).resolve().parent.parent
car = Image.open(ROOT / "tools/assets/car.png").convert("RGB")
w, h = car.size
side = max(w, h)
# đệm cho vuông bằng cách lặp pixel mép (không để lộ đường nối)
a = np.array(car)
py, px = (side - h) // 2, (side - w) // 2
sq = Image.fromarray(np.pad(a, ((py, side - h - py), (px, side - w - px), (0, 0)), mode="edge"))
for s in (192, 512):
    ic = sq.resize((s, s), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=s / 160, percent=70, threshold=2))
    ic.save(ROOT / f"icons/icon-{s}.png")
sq.resize((96, 96), Image.LANCZOS).save(ROOT / "icons/logo.png")
(ROOT / "img").mkdir(exist_ok=True)
Image.open(ROOT / "tools/assets/interior.png").convert("RGB").save(ROOT / "img/interior.jpg", quality=80, optimize=True)
print("ok")
