"use strict";
/* Mục "Lỗi thường gặp": dữ liệu do cộng đồng chủ xe VF 8 All New tổng hợp (data/errors.json).
   Hiển thị tách biệt với HDSD chính hãng và luôn gắn nhãn nguồn + khuyến cáo. */
let ERRS = [];
const EF = {q: "", status: "", group: "", tips: false}; // bộ lọc đang chọn

const ST = [
  {key: "ok", label: "Đã có cách fix", short: "Đã fix", ic: "✅"},
  {key: "tmp", label: "Có cách xử lý tạm", short: "Xử lý tạm", ic: "🩹"},
  {key: "wait", label: "Chờ VinFast xử lý", short: "Chờ VinFast", ic: "⏳"},
  {key: "none", label: "Chưa có cách fix", short: "Chưa có cách fix", ic: "❗"}
];
const stKey = s => (ST.find(x => x.label === s) || {key: "unk"}).key;
const stInfo = s => ST.find(x => x.label === s) || {short: s || "Chưa rõ", ic: "•"};
const isTip = e => /Góp ý/.test(e.cat);
const notBug = e => /Không phải lỗi/.test(e.cat);

// Văn bản -> danh sách ý: tách theo ";" hoặc hết câu; chữ trong nháy được in đậm
function errBold(h) { return h.replace(/(?:'|"|“|‘)([^'"”’]{2,45})(?:'|"|”|’)/g, "<b>$1</b>"); }
function errLines(t) {
  const parts = t.split(/\n+|;\s+|(?<=[.!?])\s+(?=[A-ZĐÀ-Ỵ])/).map(x => x.trim().replace(/[.;]$/, "")).filter(Boolean);
  if (parts.length < 2) return `<p>${errBold(esc(t))}</p>`;
  return `<ul>${parts.map(p => `<li>${errBold(esc(p.charAt(0).toUpperCase() + p.slice(1)))}</li>`).join("")}</ul>`;
}

function errCard(e, open) {
  const si = stInfo(e.status), k = stKey(e.status);
  const blocks = [];
  if (e.ctx) blocks.push(`<div class="eb"><h5>📍 Hoàn cảnh xảy ra</h5>${errLines(e.ctx)}</div>`);
  if (e.tmp) blocks.push(`<div class="eb tmp"><h5>🩹 Cách xử lý tạm</h5>${errLines(e.tmp)}</div>`);
  if (e.fix) blocks.push(`<div class="eb fix"><h5>🔧 Cách fix triệt để${e.where ? ` <span class="where">${esc(e.where)}</span>` : ""}</h5>${errLines(e.fix)}</div>`);
  if (!e.tmp && !e.fix) blocks.push(`<div class="eb none"><h5>Chưa có hướng dẫn</h5><p>Chưa ai ghi nhận cách xử lý cho lỗi này. Nếu liên quan an toàn, hãy mang xe ra xưởng VinFast.</p></div>`);
  const meta = [];
  if (e.ver) meta.push(`Phần mềm ${esc(e.ver)}`);
  if (e.date) meta.push(`Báo ngày ${esc(e.date)}`);
  return `<details class="ecard st-${k}"${open ? " open" : ""}>
    <summary>
      <div class="erow"><span class="spill st-${k}">${si.ic} ${esc(si.short)}</span>${e.n ? `<span class="epl">👥 ${e.n} người gặp</span>` : ""}${notBug(e) ? `<span class="enb">Có thể không phải lỗi</span>` : ""}</div>
      <div class="etitle">${esc(e.desc)}</div>
      <div class="egrp">${esc(e.group)}</div>
    </summary>
    <div class="ebody">${blocks.join("")}${meta.length ? `<p class="emeta">${meta.join(" · ")}</p>` : ""}</div>
  </details>`;
}

const ERR_DISCLAIMER = `<div class="edisc"><span>⚠️</span><p><b>Thông tin do cộng đồng chủ xe chia sẻ</b> (nhóm VF8 All New, tổng hợp 10–14/10/2026), chỉ để tham khảo, <b>không phải hướng dẫn chính hãng VinFast</b>. Lỗi liên quan an toàn (phanh, lái, pin, túi khí) nên mang ra xưởng kiểm tra.</p></div>`;

function errFiltered() {
  const toks = words(EF.q).filter(w => !STOP.has(w));
  return ERRS.filter(e => {
    if (EF.status && e.status !== EF.status) return false;
    if (EF.group && e.group !== EF.group) return false;
    if (!EF.tips && isTip(e)) return false;
    if (toks.length) {
      const hay = " " + words([e.desc, e.ctx, e.tmp, e.fix, e.group].join(" ")).join(" ") + " ";
      return toks.every(t => hay.includes(" " + t) || hay.includes(t));
    }
    return true;
  }).sort((a, b) => b.n - a.n || a.id - b.id);
}

function errList() {
  const list = errFiltered();
  $("#ecount").textContent = list.length + " lỗi";
  $("#elist").innerHTML = list.length ? list.map(e => errCard(e)).join("") : `<p class="empty">Không có lỗi nào khớp bộ lọc. Thử bỏ bớt bộ lọc hoặc đổi từ khóa.</p>`;
}

function errChips() {
  const cnt = (f) => ERRS.filter(e => (EF.tips || !isTip(e)) && f(e)).length;
  const sChips = [{label: "", short: "Tất cả", ic: "", key: "all"}, ...ST].map(s => {
    const n = cnt(e => !s.label || e.status === s.label);
    return `<button class="fchip st-${s.key}${(EF.status || "") === s.label ? " on" : ""}" data-st="${esc(s.label)}">${s.ic ? s.ic + " " : ""}${esc(s.short)} <i>${n}</i></button>`;
  }).join("");
  const groups = [...new Set(ERRS.map(e => e.group))].sort((a, b) => ERRS.filter(e => e.group === b).length - ERRS.filter(e => e.group === a).length);
  const gChips = [`<button class="fchip${EF.group ? "" : " on"}" data-g="">Mọi nhóm</button>`, ...groups.map(g => `<button class="fchip${EF.group === g ? " on" : ""}" data-g="${esc(g)}">${esc(g)} <i>${cnt(e => e.group === g)}</i></button>`)].join("");
  $("#est").innerHTML = sChips;
  $("#egr").innerHTML = gChips;
  $("#est").querySelectorAll("button").forEach(b => b.onclick = () => { EF.status = b.dataset.st; errChips(); errList(); });
  $("#egr").querySelectorAll("button").forEach(b => b.onclick = () => { EF.group = b.dataset.g; errChips(); errList(); });
}

function errorsBanner() {
  if (!ERRS.length) return "";
  const open = ERRS.filter(e => e.status !== "Đã có cách fix" && !isTip(e)).length;
  return `<a class="ebanner" href="#/errors"><span class="ebi">🛠️</span><span class="ebt"><b>Lỗi thường gặp & cách khắc phục</b><small>${ERRS.length} lỗi chủ xe VF 8 All New đã báo · tìm theo triệu chứng</small></span><span class="ebg">›</span></a>`;
}

function errorsView() {
  app.innerHTML = `<a class="back" href="#/">‹ Trang chủ</a>
    <header class="ehero"><span>🛠️</span><div><h1>Lỗi thường gặp</h1><p>Chủ xe VF 8 All New đã gặp gì và xử lý ra sao</p></div></header>
    ${ERR_DISCLAIMER}
    <div class="esearch"><input id="eq" type="search" placeholder="Tìm theo triệu chứng: màn hình, cửa hậu, sạc…" value="${esc(EF.q)}" aria-label="Tìm lỗi" autocomplete="off"></div>
    <div class="frow" id="est"></div>
    <div class="frow" id="egr"></div>
    <div class="etools"><span id="ecount"></span><label><input type="checkbox" id="etip"${EF.tips ? " checked" : ""}> Hiện cả góp ý, nhận xét</label></div>
    <div id="elist"></div>
    <p class="note">Sắp xếp theo số người gặp nhiều nhất. Bấm vào từng lỗi để xem hoàn cảnh và cách xử lý.</p>`;
  $("#eq").oninput = e => { EF.q = e.target.value; errChips(); errList(); };
  $("#etip").onchange = e => { EF.tips = e.target.checked; errChips(); errList(); };
  errChips();
  errList();
  window.scrollTo(0, 0);
}

// Gợi ý lỗi liên quan khi hỏi ở ô hỏi đáp chính
const ERR_STOP = new Set(["bi", "dung", "thi", "sao", "gi", "nao", "cai", "cac", "nhu", "rat", "hay"]);
function errorHits(q) {
  if (!ERRS.length) return "";
  const toks = [...new Set(words(q).filter(w => !STOP.has(w) && !ERR_STOP.has(w)))];
  if (!toks.length) return "";
  const nq = " " + words(q).join(" ") + " ";
  const scored = ERRS.filter(e => !isTip(e)).map(e => {
    const d = " " + words(e.desc).join(" ") + " ", g = " " + words(e.group).join(" ") + " ";
    const r = " " + words([e.ctx, e.tmp, e.fix].join(" ")).join(" ") + " ";
    let s = 0, inDesc = 0;
    toks.forEach(t => { if (d.includes(" " + t + " ")) { s += 3; inDesc++; } else if (g.includes(" " + t + " ") || r.includes(" " + t + " ")) s += 1; });
    for (let i = 0; i + 1 < toks.length; i++) if (d.includes(" " + toks[i] + " " + toks[i + 1] + " ")) s += 2; // cụm 2 từ liền nhau
    return {e, s, inDesc};
  }).filter(x => x.inDesc >= Math.ceil(toks.length * 0.6) && x.s >= Math.min(5, toks.length * 3)).sort((a, b) => b.s - a.s || b.e.n - a.e.n).slice(0, 3);
  if (!scored.length) return "";
  return `<section class="eask"><h2>🛠️ Chủ xe cũng từng gặp</h2>${scored.map(x => errCard(x.e)).join("")}<a class="btn ghost" href="#/errors">Xem tất cả lỗi thường gặp</a><p class="note">Thông tin do cộng đồng chủ xe chia sẻ, chỉ để tham khảo, không phải chính hãng VinFast.</p></section>`;
}
