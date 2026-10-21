"""Tải Hướng dẫn sử dụng VF 8 All New (VF8NP, 2026) từ API công khai của VinFast
và cắt thành các đoạn (chunk) theo tiêu đề -> data/manual.json.
Chạy: python tools/build_data.py            (tải mới)
      python tools/build_data.py --cache f  (dùng file menu json đã tải)"""
import json, re, sys, urllib.request, html as htmllib
from pathlib import Path

API = "https://omapi.vinfastauto.com/fe/v1/menu?carModel=VF8NP&version=2026&lang=vi&country=vn"
OUT = Path(__file__).resolve().parent.parent / "data" / "manual.json"
HEAD_CLASSES = ("Detail-Heading", "Sub-Section", "Sub-Sub-Heading")
LEVEL = {"Detail-Heading": 1, "Sub-Section": 2, "Sub-Sub-Heading": 3}

def load():
    if "--cache" in sys.argv:
        return json.load(open(sys.argv[sys.argv.index("--cache") + 1], encoding="utf8"))["data"]
    req = urllib.request.Request(API, headers={"User-Agent": "Mozilla/5.0"})
    return json.load(urllib.request.urlopen(req, timeout=120))["data"]

def strip(h):
    h = re.sub(r"<img[^>]*>", " ", h)
    h = re.sub(r"<br\s*/?>", " ", h)
    h = re.sub(r"</(p|li|tr|div|section)>", " ", h)
    return re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", h))).strip()

def clean_html(h):
    # bỏ icon cảnh báo trống alt, giữ nội dung; link nội bộ -> link tới trang chính thức
    h = re.sub(r'href="detail\?', 'href="https://om.vinfastauto.com/vi_vn/detail?', h)
    h = re.sub(r'<a ', '<a target="_blank" rel="noopener" ', h)
    h = re.sub(r'alt="\[Alt text was not generated\.\]"', 'alt=""', h)
    h = re.sub(r"<img ", '<img loading="lazy" ', h)
    return h.strip()

def split_blocks(html):
    """Tách html thành các khối cấp cao nhất (p, ol, ul, table, section...)."""
    # nhân đôi: chia tại mỗi <p class="Heading..."> (kể cả nằm trong <section>) bằng regex đơn giản
    pat = re.compile(r'(<p class="(?:%s)"[^>]*>.*?</p>)' % "|".join(HEAD_CLASSES), re.S)
    parts = pat.split(html)
    return parts

def main():
    data = load()
    chunks = []
    for l1 in data:
        for sec in l1["childs"]:
            html = sec.get("html") or ""
            if not html:
                continue
            anchors = {x["id"]: x["name"] for x in (sec.get("level3") or [])}
            parts = split_blocks(html)
            path = [sec["name"]]
            cur_anchor = None
            buf = parts[0]
            heads = []  # (level, text, anchor)
            def flush(body, hpath, anchor):
                text = strip(body)
                if len(text) < 25:
                    return
                chunks.append({
                    "id": len(chunks), "lv1": l1["id"], "lv2": sec["id"],
                    "chapter": l1["name"], "section": sec["name"],
                    "path": hpath, "anchor": anchor,
                    "html": clean_html(body), "text": text})
            stack = []  # (level, title)
            anchor = None
            if buf.strip():
                flush(buf, [], None)
            i = 1
            while i < len(parts):
                head_html, body = parts[i], parts[i + 1] if i + 1 < len(parts) else ""
                cls = re.search(r'class="([^"]+)"', head_html).group(1)
                lvl = LEVEL[cls]
                title = strip(head_html)
                m = re.search(r'id="([^"]+)"', head_html)
                if lvl == 1 and m:
                    anchor = m.group(1)
                while stack and stack[-1][0] >= lvl:
                    stack.pop()
                stack.append((lvl, title))
                flush(body, [t for _, t in stack], anchor)
                i += 2
    OUT.write_text(json.dumps(chunks, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    tot = sum(len(c["text"]) for c in chunks)
    print(f"{len(chunks)} chunks, {tot:,} chars -> {OUT} ({OUT.stat().st_size:,} bytes)")

if __name__ == "__main__":
    main()
