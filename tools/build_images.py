"""Tải các sơ đồ minh họa (p.Image) từ HDSD, nén WebP vào img/ (+ thumbnail img/t/),
trỏ lại src trong data/manual.json về file local và ghi data/figs.json {uid: [ảnh...]}.
Chạy SAU merge_summaries.py."""
import json, re, io, urllib.request, concurrent.futures as cf
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
chunks = json.load(open(ROOT / "data/manual.json", encoding="utf8"))
(ROOT / "img/t").mkdir(parents=True, exist_ok=True)

def name(url): return re.sub(r"\W", "_", Path(url.split("?")[0]).stem)

def fetch(url):
    n = name(url)
    full, th = ROOT / f"img/{n}.webp", ROOT / f"img/t/{n}.webp"
    if full.exists() and th.exists():
        return url, n, True
    try:
        b = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=40).read()
        im = Image.open(io.BytesIO(b)).convert("RGBA")
        if im.width < 200:
            return url, n, False
        bg = Image.new("RGBA", im.size, "white"); bg.alpha_composite(im); im = bg.convert("RGB")
        a = im.copy(); a.thumbnail((820, 820)); a.save(full, "WEBP", quality=78, method=5)
        t = im.copy(); t.thumbnail((360, 360)); t.save(th, "WEBP", quality=65, method=5)
        return url, n, True
    except Exception as e:
        print("lỗi", url, e); return url, n, False

urls = []
for c in chunks:
    for blk in re.findall(r'<p class="Image"[^>]*>.*?</p>', c["html"], re.S):
        urls += re.findall(r'src="([^"]+)"', blk)
urls = list(dict.fromkeys(urls))
with cf.ThreadPoolExecutor(10) as ex:
    ok = {u: n for u, n, good in ex.map(fetch, urls) if good}
figs = {}
for c in chunks:
    def sub(m):
        blk = m.group(0)
        def r(mm):
            u = mm.group(1)
            if u in ok:
                figs.setdefault(c["u"], [])
                if f"img/{ok[u]}.webp" not in figs[c["u"]]:
                    figs[c["u"]].append(f"img/{ok[u]}.webp")
                return f'src="img/{ok[u]}.webp"'
            return mm.group(0)
        return re.sub(r'src="([^"]+)"', r, blk)
    c["html"] = re.sub(r'<p class="Image"[^>]*>.*?</p>', sub, c["html"], flags=re.S)
json.dump(chunks, open(ROOT / "data/manual.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
json.dump(figs, open(ROOT / "data/figs.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
tot = sum(f.stat().st_size for f in (ROOT / "img").rglob("*.webp"))
print(f"{len(ok)}/{len(urls)} ảnh, {len(figs)} đơn vị có hình, {tot/1e6:.1f} MB")
