"""Chia HDSD thành các đơn vị tóm tắt (unit) và chia batch cho việc tóm tắt song song.
Ra: tools/work/units.json (uid -> chunk ids), tools/work/batch_N.json (đầu vào cho từng batch)."""
import json, collections
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
c = json.load(open(ROOT / "data/manual.json", encoding="utf8"))
g = collections.OrderedDict()
for x in c:
    g.setdefault((x["lv2"], x["path"][0] if x["path"] else ""), []).append(x)
units = []
for (lv2, h), items in g.items():
    tot = sum(len(i["text"]) for i in items)
    if tot > 2500 and any(len(i["path"]) > 1 for i in items):
        sub = collections.OrderedDict()
        for i in items:
            sub.setdefault(i["path"][1] if len(i["path"]) > 1 else "", []).append(i)
        for k, v in sub.items():
            units.append(v)
    else:
        units.append(items)
out, units_map = [], {}
for n, items in enumerate(units):
    uid = f"u{n:03d}"
    first = items[0]
    heads = [first["chapter"], first["section"]] + [p for p in first["path"][:2] if p]
    body = "\n".join((" > ".join(i["path"][2:] if len(i["path"]) > 2 else i["path"][1:]) + ": " if len(i["path"]) > 1 else "") + i["text"] for i in items)
    units_map[uid] = [i["id"] for i in items]
    out.append({"uid": uid, "where": " > ".join(heads), "chars": len(body), "text": body})
(ROOT / "tools/work").mkdir(exist_ok=True)
json.dump(units_map, open(ROOT / "tools/work/units.json", "w", encoding="utf8"), ensure_ascii=False)
NB = 8
batches = [[] for _ in range(NB)]
sizes = [0] * NB
# giữ thứ tự theo chương để mỗi agent có ngữ cảnh gần nhau: chia lát liên tiếp theo tổng ký tự
total = sum(u["chars"] for u in out); acc = 0
for u in out:
    b = min(NB - 1, acc * NB // total)
    batches[b].append(u); acc += u["chars"]
for i, b in enumerate(batches):
    json.dump(b, open(ROOT / f"tools/work/batch_{i}.json", "w", encoding="utf8"), ensure_ascii=False, indent=0)
    print(i, len(b), sum(u["chars"] for u in b), b[0]["where"][:60], "->", b[-1]["where"][:60])
