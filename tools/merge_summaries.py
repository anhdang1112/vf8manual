"""Gộp tools/work/sum_*.json (bản tóm tắt do Claude viết, mỗi đơn vị một bản) vào data/.
Ra: data/summaries.json {uid: tóm tắt}; gắn trường "u" (uid) vào từng chunk trong data/manual.json."""
import json, glob
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
units = json.load(open(ROOT / "tools/work/units.json", encoding="utf8"))
sums = {}
for f in sorted(glob.glob(str(ROOT / "tools/work/sum_*.json"))):
    sums.update(json.load(open(f, encoding="utf8")))
missing = [u for u in units if not (sums.get(u) or "").strip()]
chunks = json.load(open(ROOT / "data/manual.json", encoding="utf8"))
for uid, ids in units.items():
    for i in ids:
        chunks[i]["u"] = uid
json.dump(chunks, open(ROOT / "data/manual.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
json.dump({u: sums[u].strip() for u in units if u in sums}, open(ROOT / "data/summaries.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(sums)}/{len(units)} tóm tắt; thiếu: {missing[:10]}")
