"use strict";
/* Điều hướng đáy, tìm kiếm có gợi ý + giọng nói, checklist "Mới lái xe", gần đây / yêu thích, theme, lightbox, toast. */

/* ---------- lưu cục bộ (bọc try/catch: có thể bị chặn ở chế độ riêng tư) ---------- */
const Store = {
  get(k, d) { try { const v = localStorage.getItem("vf8." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("vf8." + k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } },
  push(k, v, max) { const a = Store.get(k, []).filter(x => x !== v); a.unshift(v); Store.set(k, a.slice(0, max)); }
};

/* ---------- theme sáng / tối / tự động ---------- */
function applyTheme(v) {
  if (v === "light" || v === "dark") document.documentElement.dataset.theme = v;
  else delete document.documentElement.dataset.theme;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = (v === "dark" || (v !== "light" && matchMedia("(prefers-color-scheme:dark)").matches)) ? "#0d121a" : "#0b43d1";
}
applyTheme(Store.get("theme", "auto"));

/* ---------- toast ---------- */
function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("on"), 3200);
}

/* ---------- thanh điều hướng đáy ---------- */
const NAV = [
  {href: "#/", ic: "🏠", t: "Trang chủ", key: ""},
  {href: "#/search", ic: "🔎", t: "Hỏi", key: "search"},
  {href: "#/start", ic: "🚀", t: "Mới lái", key: "start"},
  {href: "#/errors", ic: "🛠️", t: "Lỗi", key: "errors"},
  {menu: true, ic: "☰", t: "Menu", key: "menu"}
];
function buildNav() {
  const n = document.createElement("nav");
  n.id = "bnav";
  n.setAttribute("aria-label", "Điều hướng chính");
  n.innerHTML = NAV.map(i => i.menu
    ? `<button type="button" data-menu="1" data-key="${i.key}"><span>${i.ic}</span><b>${i.t}</b></button>`
    : `<a href="${i.href}" data-key="${i.key}"><span>${i.ic}</span><b>${i.t}</b></a>`).join("");
  document.body.appendChild(n);
  document.body.classList.add("hasnav");
}
function navActive() {
  const k = (location.hash.split("/")[1] || "");
  const map = {ask: "search", search: "search", start: "start", errors: "errors", "": ""};
  const act = k in map ? map[k] : "";
  document.querySelectorAll("#bnav [data-key]").forEach(e => e.classList.toggle("on", e.dataset.key === act && e.dataset.key !== "menu"));
}
document.addEventListener("click", e => { if (e.target.closest("[data-menu]")) openMenu(); });

/* ---------- tìm kiếm có gợi ý + giọng nói ---------- */
const HOT_Q = ["Cách sạc xe", "Mở cốp sau", "Chế độ lái", "Đèn cảnh báo trên taplo", "Kết nối CarPlay", "Phanh tay điện tử", "Hết điện ắc quy 12V", "Cách bật điều hòa", "Camera 360 dùng thế nào", "Cách dùng ACC", "Áp suất lốp bao nhiêu", "Khóa cửa trẻ em"];
let SUGG = null;
function buildSugg() {
  SUGG = [];
  TOPIC_GROUPS.forEach(g => g.topics.forEach(t => SUGG.push({k: "topic", t: t.t, ic: t.ic, href: "#/topic/" + t.id, n: norm(t.t)})));
  const seen = new Set();
  CHUNKS.forEach(c => { const h = c.path[0]; if (h && !seen.has(h) && h.length < 70) { seen.add(h); SUGG.push({k: "sec", t: h, ic: "📖", href: `#/section/${c.lv2}/${c.id}`, n: norm(h), sub: c.section}); } });
  ERRS.forEach(e => SUGG.push({k: "err", t: e.desc.length > 70 ? e.desc.slice(0, 68) + "…" : e.desc, ic: "🛠️", href: "#/errors", n: norm(e.desc), q: e.desc}));
}
function suggest(q) {
  if (!SUGG) buildSugg();
  const toks = norm(q).split(/[^a-z0-9]+/).filter(Boolean);
  if (!toks.length) return [];
  const rank = {topic: 0, sec: 1, err: 2};
  return SUGG.filter(s => toks.every(t => s.n.includes(t))).sort((a, b) => rank[a.k] - rank[b.k] || a.t.length - b.t.length).slice(0, 7);
}

function searchView() {
  const recent = Store.get("searches", []);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  app.innerHTML = `<h1 class="ph">Hỏi về xe</h1>
    <form class="ask solo big" id="askf" role="search">
      <input id="q" type="search" placeholder="Gõ câu hỏi…" autocomplete="off" aria-label="Câu hỏi" enterkeyhint="search">
      ${SR ? `<button type="button" id="mic" class="mic" aria-label="Hỏi bằng giọng nói">🎤</button>` : ""}
      <button type="submit">Hỏi</button>
    </form>
    <p class="notice sm">🚦 Hãy dừng xe an toàn trước khi tra cứu, không dùng khi đang lái.</p>
    <div id="sg"></div>
    <div id="sdef">
      ${recent.length ? `<h2>Đã hỏi gần đây</h2><div class="chips2">${recent.map(r => `<button class="chip2" data-q="${esc(r)}">🕘 ${esc(r)}</button>`).join("")}<button class="chip2 clr" id="clrh">Xóa</button></div>` : ""}
      <h2>Câu hỏi hay gặp</h2><div class="chips2">${HOT_Q.map(r => `<button class="chip2" data-q="${esc(r)}">${esc(r)}</button>`).join("")}</div>
    </div>`;
  const q = $("#q"), sg = $("#sg"), sdef = $("#sdef");
  const go = text => { text = text.trim(); if (text) { Store.push("searches", text, 6); location.hash = "#/ask/" + encodeURIComponent(text); } };
  $("#askf").onsubmit = e => { e.preventDefault(); go(q.value); };
  q.oninput = () => {
    const list = suggest(q.value);
    sdef.hidden = !!q.value.trim();
    sg.innerHTML = q.value.trim() ? `<ul class="sglist"><li><button class="sgask" data-q="${esc(q.value.trim())}">🔎 Hỏi: <b>${esc(q.value.trim())}</b></button></li>${list.map(s => `<li><a href="${s.href}"${s.k === "err" ? ` data-eq="${esc(s.q)}"` : ""}><span>${s.ic}</span><span class="sgt">${esc(s.t)}${s.sub ? `<small>${esc(s.sub)}</small>` : ""}${s.k === "err" ? `<small>Lỗi thường gặp</small>` : ""}</span></a></li>`).join("")}</ul>` : "";
  };
  app.addEventListener("click", function h(e) {
    if (!app.contains(q)) return app.removeEventListener("click", h);
    const b = e.target.closest("[data-q]"); if (b) go(b.dataset.q);
    if (e.target.id === "clrh") { Store.set("searches", []); searchView(); }
    const ea = e.target.closest("[data-eq]"); if (ea) { EF.q = ""; EF.status = ""; EF.group = ""; }
  });
  if (SR) {
    $("#mic").onclick = () => {
      const r = new SR(); r.lang = "vi-VN"; r.interimResults = false;
      $("#mic").classList.add("rec");
      r.onresult = ev => { q.value = ev.results[0][0].transcript; q.oninput(); go(q.value); };
      r.onerror = () => { toast("Không nghe được, thử lại nhé"); };
      r.onend = () => $("#mic").classList.remove("rec");
      try { r.start(); } catch (e) { /* đang chạy */ }
    };
  }
  q.focus();
  window.scrollTo(0, 0);
}

/* ---------- Mới lái xe: checklist ---------- */
const START_STEPS = [
  {id: "chia-khoa", why: "Mở khóa, khóa xe, chìa cơ khi hết pin chìa"},
  {id: "khoi-dong", why: "Cách khởi động và tắt xe điện"},
  {id: "can-so", why: "Gài số P, R, N, D và chế độ lái"},
  {id: "phanh-tay", why: "Phanh tay điện tử, giữ phanh tự động"},
  {id: "den", why: "Đèn pha, xi-nhan, đèn khẩn cấp"},
  {id: "den-canh-bao", why: "Biết đèn nào báo gì trên màn hình lái"},
  {id: "sac", why: "Cách sạc xe an toàn"},
  {id: "lien-he", why: "Số tổng đài VinFast và gọi khẩn cấp"}
];
const startDone = () => Store.get("start", {});
function startCard() {
  const d = startDone(), n = START_STEPS.filter(s => d[s.id]).length;
  return `<a class="startcard" href="#/start"><span class="sci">🚀</span><span class="sct"><b>Mới lái xe? Bắt đầu từ đây</b><small>${n === START_STEPS.length ? "Bạn đã xem hết 8 việc cơ bản 🎉" : `8 việc cần biết trước lần lái đầu · đã xem ${n}/8`}</small><i style="--p:${Math.round(n / 8 * 100)}%"></i></span><span class="gch">›</span></a>`;
}
function startView() {
  const d = startDone(), n = START_STEPS.filter(s => d[s.id]).length;
  app.innerHTML = `<header class="phead"><span>🚀</span><div><h1>Mới lái xe? Bắt đầu từ đây</h1><p>8 việc nên biết trước lần lái đầu tiên</p></div></header>
    <div class="prog"><i style="width:${Math.round(n / 8 * 100)}%"></i></div><p class="progt">Đã xem <b>${n}/8</b></p>
    <ol class="steps8">${START_STEPS.map((s, i) => {
      const t = findTopic(s.id);
      return `<li class="${d[s.id] ? "done" : ""}"><button class="chk" data-done="${s.id}" aria-pressed="${!!d[s.id]}" aria-label="Đánh dấu đã xem: ${esc(t.t)}">${d[s.id] ? "✓" : i + 1}</button>
        <a href="#/topic/${s.id}"><b>${t.ic} ${esc(t.t)}</b><small>${esc(s.why)}</small></a><span class="gch">›</span></li>`;
    }).join("")}</ol>
    <p class="note">Bấm vào số để đánh dấu đã xem. Tiến độ lưu trên điện thoại của bạn.</p>`;
  app.querySelectorAll("[data-done]").forEach(b => b.onclick = () => { const x = startDone(); x[b.dataset.done] = !x[b.dataset.done]; Store.set("start", x); startView(); });
  window.scrollTo(0, 0);
}

/* ---------- Gần đây / Yêu thích / mẹo an toàn ---------- */
function topicChip(id) { const t = findTopic(id); return t ? `<a class="tchip" href="#/topic/${id}"><span>${t.ic}</span>${esc(t.t)}</a>` : ""; }
function recentRows() {
  const fav = Store.get("favs", []).filter(findTopic), rec = Store.get("recent", []).filter(id => findTopic(id) && !fav.includes(id)).slice(0, 5);
  return (fav.length ? `<section class="tg"><h2>⭐ Yêu thích</h2><div class="hrow">${fav.map(topicChip).join("")}</div></section>` : "")
    + (rec.length ? `<section class="tg"><h2>🕘 Xem gần đây</h2><div class="hrow">${rec.map(topicChip).join("")}</div></section>` : "");
}
function safetyTip() {
  if (Store.get("tipHidden", false)) return "";
  return `<div class="tip" id="tip"><span>🚦</span><p>Hãy <b>dừng xe an toàn</b> trước khi tra cứu. Không dùng app khi đang lái.</p><button aria-label="Đóng" id="tipx">✕</button></div>`;
}
function bindHome() {
  const x = document.getElementById("tipx");
  if (x) x.onclick = () => { Store.set("tipHidden", true); document.getElementById("tip").remove(); };
}
function topicDecorate(t) {
  Store.push("recent", t.id, 8);
  const b = document.querySelector("[data-fav]");
  if (!b) return;
  const upd = () => { const on = Store.get("favs", []).includes(t.id); b.textContent = on ? "★" : "☆"; b.setAttribute("aria-pressed", on); b.classList.toggle("on", on); };
  b.onclick = () => { const f = Store.get("favs", []); const i = f.indexOf(t.id); if (i >= 0) f.splice(i, 1); else f.unshift(t.id); Store.set("favs", f); upd(); toast(i >= 0 ? "Đã bỏ khỏi yêu thích" : "Đã lưu vào yêu thích"); };
  upd();
}

/* ---------- lightbox: nút đóng, chạm để phóng to, chuyển ảnh ---------- */
let LB = null;
function lbOpen(list, i) {
  lbClose();
  const el = document.createElement("div");
  el.className = "lightbox";
  el.setAttribute("role", "dialog");
  el.innerHTML = `<button class="lbx" aria-label="Đóng">✕</button>${list.length > 1 ? `<button class="lbn prev" aria-label="Ảnh trước">‹</button><button class="lbn next" aria-label="Ảnh sau">›</button>` : ""}<div class="lbs"><img alt=""></div><span class="lbc"></span>`;
  document.body.appendChild(el);
  LB = {el, list, i, zoom: false};
  const img = el.querySelector("img");
  const show = () => { img.src = list[LB.i]; LB.zoom = false; el.classList.remove("zoom"); el.querySelector(".lbc").textContent = (list.length > 1 ? `${LB.i + 1}/${list.length} · ` : "") + "Chạm vào hình để phóng to"; };
  show();
  el.querySelector(".lbx").onclick = lbClose;
  const step = d => { LB.i = (LB.i + d + list.length) % list.length; show(); };
  const p = el.querySelector(".prev"), n = el.querySelector(".next");
  if (p) { p.onclick = () => step(-1); n.onclick = () => step(1); }
  img.onclick = () => { LB.zoom = !LB.zoom; el.classList.toggle("zoom", LB.zoom); };
  el.addEventListener("click", e => { if (e.target === el || e.target.classList.contains("lbs")) lbClose(); });
  let sx = null;
  el.addEventListener("touchstart", e => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, {passive: true});
  el.addEventListener("touchend", e => { if (sx != null && !LB.zoom && list.length > 1) { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); } sx = null; }, {passive: true});
  document.body.classList.add("nosc");
}
function lbClose() { if (LB) { LB.el.remove(); LB = null; document.body.classList.remove("nosc"); } }
document.addEventListener("keydown", e => {
  if (!LB) return;
  if (e.key === "Escape") lbClose();
  else if (e.key === "ArrowRight" && LB.list.length > 1) { LB.i = (LB.i + 1) % LB.list.length; LB.el.querySelector("img").src = LB.list[LB.i]; }
  else if (e.key === "ArrowLeft" && LB.list.length > 1) { LB.i = (LB.i - 1 + LB.list.length) % LB.list.length; LB.el.querySelector("img").src = LB.list[LB.i]; }
});
document.addEventListener("click", e => {
  const lg = e.target.closest("[data-legend]");
  if (lg) {
    const d = lg.closest(".unit, .card, section")?.querySelector("details.orig");
    if (d) { d.open = true; d.scrollIntoView({block: "start", behavior: "smooth"}); }
    return;
  }
  const z = e.target.closest("[data-zoom]") || e.target.closest(".md p.Image img");
  if (!z) return;
  const scope = z.closest(".figs") || z.closest(".md") || document;
  const imgs = [...scope.querySelectorAll("[data-zoom], p.Image img")];
  const list = imgs.map(x => x.dataset.zoom || x.getAttribute("src"));
  lbOpen(list, Math.max(0, imgs.indexOf(z)));
});

/* ---------- khởi tạo ---------- */
buildNav();
window.addEventListener("hashchange", navActive);
