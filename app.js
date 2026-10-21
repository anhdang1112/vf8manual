"use strict";
const $ = (s, r = document) => r.querySelector(s);
const app = $("#app"), statusEl = $("#status");
const OFFICIAL = "https://om.vinfastauto.com/vi_vn/detail?car=VF8NP&year=2026";
let CHUNKS = [], SUMS = {}, FIGS = {}, BY_SECTION = new Map(), INDEX = null;

/* ---------- chuẩn hoá tiếng Việt ---------- */
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
const words = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
const STOP = new Set(("la gi the nao lam sao nhu cach de co khong va xe cho toi minh em anh ban bi khi nen can muon duoc hom nay o tren trong voi mot cac nhung thi ma hay ra vao tai vi").split(" "));
// Mở rộng truy vấn bằng thuật ngữ đúng trong HDSD. Chỉ để TÌM, không tạo ra nội dung trả lời.
const SYN = [
  [/ga tu dong|cruise|giu toc do/, "acc kiem soat hanh trinh thich ung"],
  [/phanh tay|handbrake/, "phanh tay dien tu"],
  [/xi nhan|signal/, "den bao re"],
  [/hazard|nguy hiem|dung khan/, "den canh bao nguy hiem"],
  [/bom lop|hoi lop|ap suat|lop non/, "ap suat lop"],
  [/binh dien 12|ac quy|het dien 12|kich binh|cuu binh/, "ac quy 12v khoi dong bang nguon ho tro"],
  [/may lanh|lam mat|dieu hoa/, "dieu hoa khong khi"],
  [/cop sau|cop xe|cua hau|mo cop/, "cua hau van hanh cua hau dien mo dong cua hau"],
  [/cop truoc|nap ca po|capo/, "nap ca po khoang truoc"],
  [/sac pin|sac dien|cam sac|sac xe|tram sac|cach sac/, "huong dan sac de sac xe thuc hien theo quy trinh"],
  [/cong sac|nap sac/, "cong sac nap cong sac"],
  [/chia khoa/, "chia khoa dieu khien tu xa"],
  [/cam 360|camera 360|toan canh/, "giam sat toan canh 360"],
  [/cam lui|lui xe/, "camera lui"],
  [/diem mu/, "canh bao diem mu"],
  [/dan duong|ban do|chi duong|map/, "dan duong vietmap"],
  [/carplay|android auto|ket noi dien thoai/, "apple carplay android auto dien thoai"],
  [/ngap|lut|mua lon/, "ngap nuoc"],
  [/keo xe|cuu ho|hong xe giua duong/, "keo xe cuu ho"],
  [/che do lai|eco|sport|normal/, "che do lai"],
    [/gat mua|rua kinh/, "gat mua rua kinh"],
  [/ghe tre em|ghe an toan tre|baby|con nho|em be/, "ghe tre em"],
  [/khoa tre em|khoa cua tre em|khoa an toan cua sau/, "khoa tre em cua sau"],
  [/taplo|dong ho|man hinh lai|den bao loi|den canh bao/, "man hinh hien thi danh cho nguoi lai den canh bao va den bao"],
  [/cap nhat phan mem|ota|sota/, "cap nhat phan mem tu xa"],
  [/cam trai|nghi ngoi/, "che do cam trai"],
];
const grams = t => { const o = []; for (let i = 0; i < t.length; i++) { o.push(t[i]); if (i + 1 < t.length) o.push(t[i] + "_" + t[i + 1]); } return o; };

function buildIndex() {
  // Mỗi tài liệu = một đơn vị tóm tắt (gồm nhiều đoạn): tiêu đề x3 + tóm tắt x2 + nguyên văn
  const byU = new Map();
  CHUNKS.forEach(c => { if (!byU.has(c.u)) byU.set(c.u, []); byU.get(c.u).push(c); });
  const keys = [...byU.keys()];
  const docs = keys.map(u => {
    const cs = byU.get(u), f = cs[0];
    const head = words(cs.map(c => c.path.join(" ")).join(" ") + " " + f.section);
    const title = words(f.section + " " + f.chapter);
    const sum = words(SUMS[u] || ""), body = words(cs.map(c => c.text).join(" "));
    const toks = grams(body).concat(grams(sum), grams(sum), grams(head), grams(head), grams(head), grams(title));
    const tf = new Map();
    toks.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    return {tf, len: toks.length, first: f};
  });
  const df = new Map();
  docs.forEach(d => d.tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1)));
  INDEX = {docs, df, avg: docs.reduce((a, d) => a + d.len, 0) / docs.length, N: docs.length};
}

function search(q, limit = 5) {
  const nq = norm(q);
  let extra = "";
  SYN.forEach(([re, add]) => { if (re.test(nq)) extra += " " + add; });
  const base = words(q).filter(w => !STOP.has(w));
  const W = new Map(); // thuật ngữ -> trọng số (từ đồng nghĩa được ưu tiên vì là đúng tên mục trong HDSD)
  grams(base).forEach(t => W.set(t, 1));
  grams(words(extra).filter(w => !STOP.has(w))).forEach(t => W.set(t, 2));
  if (!W.size) return {hits: [], max: 0};
  const k1 = 1.4, b = 0.75, {docs, df, avg, N} = INDEX;
  const scores = docs.map((d, i) => {
    let s = 0;
    for (const [t, w] of W) {
      const f = d.tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - df.get(t) + .5) / (df.get(t) + .5));
      s += w * idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avg));
    }
    return {i, s};
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  const hits = [];
  for (const x of scores) {
    const c = docs[x.i].first;
    hits.push({c, s: x.s});
    if (hits.length >= limit) break;
  }
  return {hits, max: scores.length ? scores[0].s : 0};
}

/* ---------- hiển thị ---------- */
const esc = s => s.replace(/[&<>"]/g, m => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[m]));
const officialUrl = c => `${OFFICIAL}&lv1=${c.lv1}&lv2=${c.lv2}` + (c.anchor ? `&lv3=${c.anchor}` : "");
const crumb = c => esc([c.section, ...c.path.slice(0, 2)].filter((x, i, a) => a.indexOf(x) === i).join(" › "));
const thumb = f => f.replace("img/", "img/t/");

// Tóm tắt (text thuần) -> HTML: câu mở đầu, danh sách, ô cảnh báo
// Tách "Nhãn: nội dung" (nhãn ngắn) để nhãn thành tiêu đề riêng một dòng
let EM = null; // regex các thuật ngữ in đậm của mục đang hiển thị
const emph = x => { const h = esc(x); return EM ? h.replace(EM, '<b class="ft">$1</b>') : h; };
const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
const splitLabel = t => { const m = t.match(/^([^:.;()]{1,48}):\s+([\s\S]*)$/); return m ? [m[1], m[2]] : [null, t]; };

function fmtBullet(t) {
  const [lab, rest] = splitLabel(t);
  const head = lab ? `<b class="lb">${emph(lab)}</b>` : "";
  const steps = rest.split(/\s*(?=\b\d{1,2}\)\s)/).filter(Boolean);
  if (steps.length >= 2 && /^1\)/.test(steps[0])) { // các bước 1) 2) 3) -> danh sách đánh số
    return `<li${lab ? "" : ' class="so"'}>${head}<ol class="steps">${steps.map(s => `<li>${emph(cap(s.replace(/^\d{1,2}\)\s*/, "").replace(/[;,]\s*$/, "")))}</li>`).join("")}</ol></li>`;
  }
  const segs = rest.split(/;\s+/).filter(Boolean);
  if (segs.length >= 2 && rest.length > 80) { // nhiều ý ngăn bằng ";" -> mỗi ý một dòng
    return `<li${lab ? "" : ' class="so"'}>${head}<ul class="sub">${segs.map(s => { const [l2, r2] = splitLabel(s); return `<li>${l2 ? `<b>${esc(l2)}:</b> ` : ""}${emph(cap(r2.replace(/[.;]\s*$/, "")))}</li>`; }).join("")}</ul></li>`;
  }
  return `<li>${head}<span class="tx">${emph(rest)}</span></li>`;
}

function fmtSum(t, info) {
  EM = info && info.terms.length ? new RegExp("(" + info.terms.map(x => esc(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "g") : null;
  const lines = t.split("\n").map(x => x.trim()).filter(Boolean);
  let out = "", ul = [];
  const flush = () => { if (ul.length) { out += `<ul class="bl">${ul.join("")}</ul>`; ul = []; } };
  lines.forEach(l => {
    if (l.startsWith("•")) ul.push(fmtBullet(l.replace(/^•\s*/, "")));
    else if (l.startsWith("⚠️")) { if (info && info.boxes.length) return;  flush(); out += `<div class="warnbox"><span>⚠️</span><p>${esc(l.replace(/^⚠️\s*/, ""))}</p></div>`; }
    else { flush(); out += `<p>${emph(l)}</p>`; }
  });
  flush();
  EM = null;
  return `<div class="sumtxt">${out}</div>`;
}

function figStrip(u) {
  const f = FIGS[u];
  if (!f || !f.length) return "";
  return `<div class="figs${f.length > 1 ? " multi" : ""}">${f.slice(0, 8).map(x => `<img src="${x}" alt="Hình minh họa từ Hướng dẫn sử dụng" loading="lazy" data-zoom="${x}">`).join("")}</div>${f.length > 1 ? `<div class="figcount">${f.length} hình · vuốt ngang để xem</div>` : ""}`;
}

const UNIT_CHUNKS = new Map(), UINFO = new Map();
function unitInfo(uid, cs) {
  if (UINFO.has(uid)) return UINFO.get(uid);
  const t = document.createElement("template");
  t.innerHTML = cs.map(c => c.html).join("");
  const info = {
    proc: !!t.content.querySelector("ol"),
    terms: [...new Set([...t.content.querySelectorAll("span.Feature-Bold")].map(e => e.textContent.replace(/\s+/g, " ").trim()).filter(x => x.length >= 3 && x.length <= 40))].sort((a, b) => b.length - a.length),
    boxes: [...t.content.querySelectorAll("p.Warning,p.Note,p.Caution")].map(e => e.outerHTML)
  };
  UINFO.set(uid, info);
  return info;
}
const origOf = cs => cs.map(c => `<div id="c${c.id}">${c.path.length > 2 ? `<p class="Sub-Section"><b>${esc(c.path.slice(2).join(" › "))}</b></p>` : ""}${c.html}</div>`).join("");

// Thân một mục: có các bước thao tác -> hiện đầy đủ như HDSD; còn lại -> tóm tắt + khung cảnh báo/lưu ý nguyên văn
function unitBody(uid, cs, hitId) {
  const info = unitInfo(uid, cs), orig = origOf(cs);
  if (info.proc) return `<div class="md procmd">${orig}</div>`;
  return figStrip(uid) + (SUMS[uid] ? fmtSum(SUMS[uid], info) : "")
    + (info.boxes.length ? `<div class="md boxes">${info.boxes.join("")}</div>` : "")
    + `<details class="orig"${cs.some(c => c.id === hitId) ? " open" : ""}><summary>Xem nguyên văn HDSD</summary><div class="md">${orig}</div></details>`;
}

function unitCard(units, hitId) {
  return units.map(u => {
    const first = u.items[0];
    const sub = first.path.length > 1 ? `<h4>${esc(first.path[1])}</h4>` : "";
    return `<section class="unit">${sub}${unitBody(u.u, u.items, hitId)}</section>`;
  }).join("");
}

function renderGroups(chunks, hitId) {
  const groups = [];
  chunks.forEach(c => {
    const key = c.lv2 + "|" + (c.path[0] || "");
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) { g = {key, title: c.path[0] || c.section, section: c.section, items: []}; groups.push(g); }
    g.items.push(c);
  });
  const single = groups.length === 1;
  return groups.map((g, gi) => {
    const hit = g.items.some(c => c.id === hitId);
    const units = [];
    g.items.forEach(c => {
      let u = units[units.length - 1];
      if (!u || u.u !== c.u) { u = {u: c.u, items: []}; units.push(u); }
      u.items.push(c);
    });
    const nfig = new Set(units.flatMap(u => FIGS[u.u] || [])).size;
    const sub = g.title !== g.section ? `<small>${esc(g.section)}</small>` : "";
    return `<details class="grp${hit ? " hit" : ""}"${single || hit || (hitId == null && gi === 0) ? " open" : ""}><summary><span class="gt">${esc(g.title)}${sub}</span>${nfig ? `<span class="pill">🖼 ${nfig}</span>` : ""}</summary><div class="body">${unitCard(units, hitId)}</div></details>`;
  }).join("");
}

function bindAsk() {
  $("#askf").onsubmit = e => {
    e.preventDefault();
    const q = $("#q").value.trim();
    if (q) location.hash = "#/ask/" + encodeURIComponent(q);
  };
}

function topicChunks(t) {
  const out = [];
  t.refs.forEach(r => (BY_SECTION.get(r.s) || []).forEach(c => { if (!r.h || r.h.includes(c.path[0])) out.push(c); }));
  return out;
}
// mỗi chủ đề một ảnh đại diện riêng (không trùng file với chủ đề trước)
let TOPIC_FIG = null;
function buildTopicFigs() {
  TOPIC_FIG = {};
  const used = new Set();
  TOPIC_GROUPS.forEach(g => g.topics.forEach(t => {
    const cand = [];
    topicChunks(t).forEach(c => (FIGS[c.u] || []).forEach(f => { if (!cand.includes(f)) cand.push(f); }));
    const pick = cand.find(f => !used.has(f)) || null;
    if (pick) used.add(pick);
    TOPIC_FIG[t.id] = pick;
  }));
}
const topicFig = t => { if (!TOPIC_FIG) buildTopicFigs(); return TOPIC_FIG[t.id]; };
const findTopic = id => TOPIC_GROUPS.flatMap(g => g.topics).find(x => x.id === id);

function homeView() {
  const chips = ["Cách sạc xe", "Mở cốp sau", "Chế độ lái", "Đèn cảnh báo trên taplo", "Kết nối CarPlay", "Hết điện ắc quy 12V"];
  const urgent = [["ac-quy", "⚡", "Hết điện 12V"], ["cuu-ho", "🆘", "Kéo xe / vá lốp"], ["lien-he", "☎️", "Gọi VinFast"], ["den-canh-bao", "🚨", "Đèn cảnh báo"]];
  app.innerHTML = `
    <section class="hero">
      <p class="eyebrow">VinFast VF 8 All New</p>
      <h1>Bạn cần biết gì về xe?</h1>
      <form class="ask" id="askf" role="search">
        <input id="q" type="search" placeholder="Hỏi nhanh: cách sạc xe, mở cốp sau…" autocomplete="off" aria-label="Câu hỏi" enterkeyhint="search">
        <button type="submit" aria-label="Hỏi">Hỏi</button>
      </form>
      <div class="chips">${chips.map(c => `<button class="chip" data-q="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    </section>
    <section class="urgent"><h2>Cần gấp</h2><div class="urow">${urgent.map(([id, ic, t]) => `<a href="#/topic/${id}"><span>${ic}</span>${t}</a>`).join("")}</div></section>
    ${TOPIC_GROUPS.map((g, gi) => `<section class="tg g${gi}"><h2><i></i>${esc(g.name)}</h2><div class="grid">${g.topics.map(t => {
      const f = topicFig(t);
      return `<a class="tile" href="#/topic/${t.id}"><div class="timg">${f ? `<img src="${thumb(f)}" alt="" loading="lazy">` : `<span class="big">${t.ic}</span>`}<span class="ic">${t.ic}</span></div><span class="tt">${esc(t.t)}</span></a>`;
    }).join("")}</div></section>`).join("")}
    <p class="note">Tóm tắt do Claude soạn sẵn từ Hướng dẫn sử dụng chính hãng; luôn có nút xem nguyên văn để đối chiếu.</p>`;
  bindAsk();
  app.querySelectorAll(".chip").forEach(b => b.onclick = () => { location.hash = "#/ask/" + encodeURIComponent(b.dataset.q); });
  window.scrollTo(0, 0);
}

function topicView(id) {
  const t = findTopic(id);
  if (!t) return homeView();
  const gi = TOPIC_GROUPS.findIndex(g => g.topics.includes(t));
  const chunks = topicChunks(t), f = topicFig(t);
  app.innerHTML = `<a class="back" href="#/">‹ Tất cả chức năng</a>
    <header class="thero g${gi}">${f ? `<img src="${f}" alt="" data-zoom="${f}">` : ""}<div class="tcap"><span class="ic">${t.ic}</span><h1>${esc(t.t)}</h1></div></header>
    ${chunks.length ? renderGroups(chunks) : `<p class="empty">Không tìm thấy nội dung. Hãy mở bản gốc.</p>`}
    <div class="actions"><a class="btn ghost" target="_blank" rel="noopener" href="${chunks[0] ? officialUrl(chunks[0]) : OFFICIAL}">Mở bản gốc của VinFast ↗</a></div>`;
  window.scrollTo(0, 0);
}

function sectionView(lv2, hitId) {
  const chunks = BY_SECTION.get(+lv2);
  if (!chunks) return homeView();
  app.innerHTML = `<a class="back" href="javascript:history.back()">‹ Quay lại</a>
    <div class="crumb">${esc(chunks[0].chapter)}</div><h1 class="sech">${esc(chunks[0].section)}</h1>
    ${renderGroups(chunks, hitId)}
    <div class="actions"><a class="btn ghost" target="_blank" rel="noopener" href="${officialUrl(chunks[0])}">Mở bản gốc của VinFast ↗</a></div>`;
  const el = hitId != null && $("#c" + hitId);
  if (el) setTimeout(() => el.scrollIntoView({block: "start"}), 50); else window.scrollTo(0, 0);
}

function askView(q) {
  const {hits, max} = search(q, 12);
  const none = max < 8 || !hits.length, weak = max < 12;
  const seen = new Set(), top = [];
  hits.forEach(h => { if (!seen.has(h.c.u) && top.length < 3) { seen.add(h.c.u); top.push(h); } });
  app.innerHTML = `<a class="back" href="#/">‹ Trang chủ</a>
    <form class="ask solo" id="askf"><input id="q" type="search" value="${esc(q)}" aria-label="Câu hỏi" enterkeyhint="search"><button type="submit">Hỏi</button></form>
    ${none ? `<p class="empty">Không tìm thấy mục nào trong Hướng dẫn sử dụng khớp với câu hỏi này.<br>Thử diễn đạt khác, hoặc chọn một chức năng ở <a href="#/">trang chủ</a>.</p>` : `
    ${weak ? `<p class="notice">Chưa chắc chắn: đây là các mục <b>gần nhất</b> trong Hướng dẫn sử dụng, hãy đọc kỹ xem có đúng ý không.</p>` : ""}
    ${top.map((h, i) => `<article class="card ans${i === 0 && !weak ? " best" : ""}${weak ? " low" : ""}">
      ${i === 0 && !weak ? `<span class="badge">Trả lời gợi ý</span>` : ""}
      <div class="crumb">${crumb(h.c)}</div>
      ${unitBody(h.c.u, UNIT_CHUNKS.get(h.c.u), null)}
      <div class="actions">
        <button class="btn ghost" data-open="${h.c.id}">Xem cả mục trong HDSD</button>
        <a class="btn ghost" target="_blank" rel="noopener" href="${officialUrl(h.c)}">Bản gốc ↗</a>
      </div></article>`).join("")}
    <p class="note">Tóm tắt do Claude soạn sẵn từ HDSD; luôn có nút xem nguyên văn để đối chiếu.</p>`}`;
  bindAsk();
  app.querySelectorAll("[data-open]").forEach(b => b.onclick = () => { const c = CHUNKS[+b.dataset.open]; location.hash = `#/section/${c.lv2}/${c.id}`; });
  window.scrollTo(0, 0);
}

function route() {
  if (!CHUNKS.length) return;
  const [, kind, a, b] = location.hash.split("/");
  if (kind === "topic") topicView(a);
  else if (kind === "ask") askView(decodeURIComponent(a || ""));
  else if (kind === "section") sectionView(a, b != null ? +b : null);
  else homeView();
}

/* phóng to ảnh */
document.addEventListener("click", e => {
  const z = e.target.closest("[data-zoom]") || e.target.closest(".md p.Image img");
  if (z) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<img src="${z.dataset.zoom || z.getAttribute("src")}" alt=""><span>Chạm để đóng</span>`;
    lb.onclick = () => lb.remove();
    document.body.appendChild(lb);
  }
});

/* ---------- khởi động ---------- */
async function init() {
  statusEl.hidden = false;
  try {
    CHUNKS = await (await fetch("data/manual.json")).json();
    SUMS = await (await fetch("data/summaries.json")).json().catch(() => ({}));
    FIGS = await (await fetch("data/figs.json")).json().catch(() => ({}));
  } catch (e) {
    app.innerHTML = `<p class="empty">Không tải được dữ liệu hướng dẫn. Kiểm tra kết nối rồi tải lại trang.</p>`;
    return;
  }
  CHUNKS.forEach(c => { if (!UNIT_CHUNKS.has(c.u)) UNIT_CHUNKS.set(c.u, []); UNIT_CHUNKS.get(c.u).push(c); });
  CHUNKS.forEach(c => { if (!BY_SECTION.has(c.lv2)) BY_SECTION.set(c.lv2, []); BY_SECTION.get(c.lv2).push(c); });
  buildIndex();
  statusEl.hidden = true;
  window.addEventListener("hashchange", route);
  route();
}
init();
const APP_VERSION = "v5 · 21/10/2026";
$(".foot").insertAdjacentHTML("beforeend", `<span class="ver">Phiên bản app: ${APP_VERSION}</span>`);
if ("serviceWorker" in navigator) {
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (had) location.reload(); }); // có bản mới -> tự tải lại
  navigator.serviceWorker.register("sw.js").then(r => r.update()).catch(() => {});
}
