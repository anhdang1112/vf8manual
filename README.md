# VF 8 All New – Hướng dẫn nhanh (PWA)

Tra cứu nhanh **Hướng dẫn sử dụng VinFast VF 8 All New (2026)**: danh sách chức năng thiết yếu + ô gõ câu hỏi.
Dữ liệu lấy từ HDSD chính hãng (API công khai `omapi.vinfastauto.com`). Câu trả lời là **bản tóm tắt ngắn** (Claude soạn sẵn một lần cho 388 mục, chỉ dùng thông tin trong mục đó), luôn có nút xem nguyên văn.

- Hỏi đáp = tìm mục khớp nhất trong HDSD (BM25, bỏ dấu tiếng Việt) rồi hiện tóm tắt sẵn + nguyên văn + link bản gốc. Không gọi AI lúc chạy nên không cần API key và không bịa theo câu hỏi.
- Chạy thử: `python -m http.server 8765` rồi mở http://localhost:8765 (PWA cần HTTPS hoặc localhost).
- Cập nhật khi VinFast sửa HDSD: `python tools/build_data.py` -> `python tools/make_units.py` -> nhờ Claude tóm tắt lại các batch trong `tools/work/` (ghi `sum_N.json`) -> `python tools/merge_summaries.py`
- Sửa danh mục chức năng: `topics.js` (chỉ trỏ tới mục có sẵn trong HDSD).
- Ảnh trong HDSD tải trực tiếp từ server VinFast (cần mạng lần đầu, sau đó được cache).
- Lưu ý bản quyền: nội dung HDSD thuộc VinFast, chỉ nên dùng cá nhân/nội bộ, cân nhắc trước khi public.
