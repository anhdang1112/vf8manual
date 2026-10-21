"""Lấy tab 'Danh sách lỗi' của Google Sheet (bật chia sẻ bằng link) -> data/errors.json.
Quyền riêng tư: bỏ cột 'Người báo' và 'Ghi chú' (có tên thành viên), và thay tên người trong các cột còn lại.
Chạy: python tools/build_errors.py [--csv file.csv]"""
import csv, io, json, re, sys, urllib.request, urllib.parse
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SHEET_ID = "1mI0qI6eO1R7khzs5-hj9_UdFUf0aaOn9y4dIc62OyDw"
TAB = "Danh sách lỗi"
URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={urllib.parse.quote(TAB)}"
NAME = re.compile(r"\b(?:[Bb]ác|[Aa]nh|[Cc]hị|[Bb]ạn|[Ee]m)\s+(?!sale\b|nhân\b|kỹ\b|thợ\b|tư\b)[A-ZĐ][\wÀ-ỹ]*(?:\s+[A-ZĐ][\wÀ-ỹ]*){0,3}")
REF = re.compile(r"\s*\([^)]*(?:trong nhóm|tin nhắn|xem ảnh)[^)]*\)")  # tham chiếu tới tin nhắn/ảnh trong nhóm Zalo

def clean(t):
    t = REF.sub("", t.strip())
    t = NAME.sub("một chủ xe", t)
    t = re.sub(r"\s*\(một chủ xe\)", "", t)
    t = re.sub(r"^một chủ xe(?: \([^)]*\))?:\s*", "", t)
    return re.sub(r"[ \t]+\n", "\n", t)

def main():
    if "--csv" in sys.argv:
        raw = open(sys.argv[sys.argv.index("--csv") + 1], encoding="utf8").read()
    else:
        raw = urllib.request.urlopen(URL, timeout=60).read().decode("utf8")
    out = []
    for r in csv.DictReader(io.StringIO(raw)):
        if not (r.get("Mô tả lỗi / triệu chứng") or "").strip():
            continue
        try: n = int(r["Số người gặp"] or 0)
        except ValueError: n = 0
        out.append({
            "id": int(r["STT"]) if (r["STT"] or "").isdigit() else len(out) + 1,
            "date": r["Ngày báo"].strip(),
            "group": r["Nhóm lỗi"].strip() or "Khác",
            "desc": clean(r["Mô tả lỗi / triệu chứng"]),
            "ctx": clean(r["Hoàn cảnh xảy ra"]),
            "ver": r["Phiên bản phần mềm"].strip(),
            "tmp": clean(r["Cách xử lý tạm"]),
            "fix": clean(r["Cách fix triệt để"]),
            "where": r["Nơi fix"].strip(),
            "status": r["Trạng thái"].strip(),
            "n": n,
            "cat": r["Phân loại"].strip(),
        })
    (ROOT / "data/errors.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    print(len(out), "lỗi ->", "data/errors.json")

main()
