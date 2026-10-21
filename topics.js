// Danh mục chức năng. Mỗi mục chỉ TRỎ tới phần có sẵn trong HDSD (s = id mục cấp 2, h = tên tiêu đề cấp 1 cần lấy).
// Không có nội dung tự viết ở đây: trang chi tiết hiển thị nguyên văn HDSD.
window.TOPIC_GROUPS = [
  {name: "Bắt đầu lái", topics: [
    {id: "khoi-dong", ic: "🔑", t: "Khởi động & tắt xe", refs: [{s: 1332220}]},
    {id: "can-so", ic: "🕹️", t: "Cần số & chế độ lái", refs: [{s: 1332221}]},
    {id: "chia-khoa", ic: "🗝️", t: "Chìa khóa & khóa xe", refs: [{s: 1332204}]},
    {id: "phanh-tay", ic: "🅿️", t: "Phanh tay điện tử & giữ phanh", refs: [{s: 1332227, h: ["Phanh tay xe điện tử", "Giữ phanh tự động"]}]},
    {id: "phanh-tai-sinh", ic: "♻️", t: "Phanh tái sinh", refs: [{s: 1332227, h: ["Phanh tái sinh"]}]},
    {id: "vo-lang", ic: "🎛️", t: "Vô lăng & công tắc", refs: [{s: 1332222}]},
    {id: "ghe", ic: "💺", t: "Chỉnh ghế", refs: [{s: 1332210}]},
    {id: "guong", ic: "👀", t: "Gương", refs: [{s: 1332223}]},
    {id: "den", ic: "💡", t: "Đèn, xi-nhan, đèn khẩn cấp", refs: [{s: 1332224}]},
    {id: "gat-mua", ic: "🌧️", t: "Gạt mưa & rửa kính", refs: [{s: 1332226}]}
  ]},
  {name: "Sạc & pin", topics: [
    {id: "sac", ic: "🔌", t: "Hướng dẫn sạc", refs: [{s: 1332240}]},
    {id: "pin", ic: "🔋", t: "Thông tin pin", refs: [{s: 1332241}]},
    {id: "tiet-kiem", ic: "🍃", t: "Lái xe tiết kiệm năng lượng", refs: [{s: 1332228, h: ["Lái xe tiết kiệm năng lượng"]}]}
  ]},
  {name: "An toàn & hỗ trợ lái (ADAS)", topics: [
    {id: "day-dai", ic: "🔒", t: "Dây an toàn", refs: [{s: 1332211}]},
    {id: "ghe-tre-em", ic: "🧒", t: "Ghế an toàn cho trẻ em", refs: [{s: 1332212}]},
    {id: "tui-khi", ic: "🛡️", t: "Túi khí", refs: [{s: 1332213}]},
    {id: "acc", ic: "🚗", t: "ACC – kiểm soát hành trình thích ứng", refs: [{s: 1332214, h: ["ACC- Kiểm soát hành trình thích ứng"]}]},
    {id: "giu-lan", ic: "↔️", t: "Hỗ trợ giữ làn", refs: [{s: 1332215}]},
    {id: "aeb", ic: "🛑", t: "Phanh khẩn cấp tự động (F-AEB)", refs: [{s: 1332216}]},
    {id: "canh-bao", ic: "⚠️", t: "Cảnh báo điểm mù & va chạm", refs: [{s: 1332217}]},
    {id: "do-xe", ic: "📷", t: "Hỗ trợ đỗ xe & camera 360°", refs: [{s: 1332218}]}
  ]},
  {name: "Màn hình & tiện ích", topics: [
    {id: "man-hinh", ic: "🖥️", t: "Màn hình giải trí", refs: [{s: 1332231, h: ["Tổng quan Màn hình thông tin giải trí", "Sử dụng Màn hình thông tin giải trí", "Thông báo & Điều khiển nhanh"]}]},
    {id: "den-canh-bao", ic: "🚨", t: "Đèn cảnh báo trên taplo", refs: [{s: 1332233, h: ["Đèn cảnh báo và Đèn báo"]}]},
    {id: "dieu-hoa", ic: "❄️", t: "Điều hòa", refs: [{s: 1332237}]},
    {id: "dien-thoai", ic: "📱", t: "Điện thoại, CarPlay/Android Auto, USB", refs: [{s: 1332235}]},
    {id: "dan-duong", ic: "🧭", t: "Dẫn đường", refs: [{s: 1332234}]},
    {id: "app", ic: "📲", t: "Ứng dụng VinFast", refs: [{s: 1332236}]}
  ]},
  {name: "Sự cố & hỗ trợ", topics: [
    {id: "ap-suat-lop", ic: "⭕", t: "Áp suất lốp", refs: [{s: 1332245, h: ["Áp suất lốp", "Hệ thống giám sát áp suất lốp"]}]},
    {id: "ac-quy", ic: "⚡", t: "Ắc quy 12V & khởi động bằng nguồn hỗ trợ", refs: [{s: 1332244, h: ["Ắc quy (12V)"]}, {s: 1332253, h: ["Khởi động bằng nguồn hỗ trợ"]}]},
    {id: "cuu-ho", ic: "🆘", t: "Kích xe, vá lốp, kéo xe", refs: [{s: 1332253, h: ["Kích xe và Sửa chữa lốp", "Kéo xe (EV)"]}]},
    {id: "ngap-nuoc", ic: "🌊", t: "Đi qua vùng ngập nước", refs: [{s: 1332230}]},
    {id: "lien-he", ic: "☎️", t: "Liên hệ VinFast & gọi khẩn cấp", refs: [{s: 1332254}, {s: 1332252, h: ["Cuộc gọi khẩn cấp (eCall) (nếu được trang bị)"]}]},
    {id: "bao-duong", ic: "🛠️", t: "Lịch bảo dưỡng", refs: [{s: 1332247}]}
  ]}
];
