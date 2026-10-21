"use strict";
/* Điều hướng gọn: trang chủ chỉ hiện 5 thẻ nhóm; bấm vào mở trang nhóm. Menu ☰ ở header liệt kê toàn bộ chức năng. */
const GROUP_META = [
  {ic: "🚗", desc: "Khởi động, số, phanh, đèn, ghế…"},
  {ic: "🔌", desc: "Cách sạc, pin, lái tiết kiệm"},
  {ic: "🛡️", desc: "Dây an toàn, túi khí, ACC, camera 360°"},
  {ic: "🖥️", desc: "Màn hình, điều hòa, CarPlay, app VinFast"},
  {ic: "🆘", desc: "Lốp, ắc quy, cứu hộ, liên hệ VinFast"}
];

function groupCards() {
  return `<section class="tg"><h2>Chức năng theo nhóm</h2><div class="gcards">${TOPIC_GROUPS.map((g, gi) => {
    const thumbs = g.topics.map(t => topicFig(t)).filter(Boolean).slice(0, 3);
    return `<a class="gcard g${gi}" href="#/group/${gi}">
      <span class="gic">${GROUP_META[gi].ic}</span>
      <span class="gtx"><b>${esc(g.name)}</b><small>${esc(GROUP_META[gi].desc)}</small><em>${g.topics.length} chức năng</em></span>
      <span class="gth">${thumbs.map(f => `<img src="${thumb(f)}" alt="" loading="lazy">`).join("")}</span>
      <span class="gch">›</span></a>`;
  }).join("")}</div></section>`;
}

function groupView(gi) {
  const g = TOPIC_GROUPS[gi];
  if (!g) return homeView();
  app.innerHTML = `<a class="back" href="#/">‹ Trang chủ</a>
    <header class="ghead g${gi}"><span>${GROUP_META[gi].ic}</span><div><h1>${esc(g.name)}</h1><p>${esc(GROUP_META[gi].desc)}</p></div></header>
    <div class="grid g${gi}">${g.topics.map(t => {
      const f = topicFig(t);
      return `<a class="tile" href="#/topic/${t.id}"><div class="timg">${f ? `<img src="${thumb(f)}" alt="" loading="lazy">` : `<span class="big">${t.ic}</span>`}<span class="ic">${t.ic}</span></div><span class="tt">${esc(t.t)}</span></a>`;
    }).join("")}</div>
    <nav class="gother">${TOPIC_GROUPS.map((x, i) => i === gi ? "" : `<a href="#/group/${i}">${GROUP_META[i].ic} ${esc(x.name)}</a>`).join("")}</nav>`;
  window.scrollTo(0, 0);
}

/* ---------- menu ☰ ---------- */
function closeMenu() { const m = document.getElementById("menu"); if (m) m.remove(); document.body.classList.remove("nosc"); }
function openMenu() {
  if (document.getElementById("menu")) return closeMenu();
  const m = document.createElement("div");
  m.id = "menu";
  m.innerHTML = `<div class="mback"></div><aside class="mpanel" role="dialog" aria-label="Menu">
    <div class="mtop"><b>Menu</b><button class="mclose" aria-label="Đóng menu">✕</button></div>
    <a class="mitem" href="#/">🏠 Trang chủ</a>
    <a class="mitem" href="#/start">🚀 Mới lái xe? Bắt đầu từ đây</a>
    <a class="mitem hot" href="#/errors">🛠️ Lỗi thường gặp <small>${ERRS.length || ""}</small></a>
    ${TOPIC_GROUPS.map((g, gi) => `<details class="mgrp g${gi}"><summary>${GROUP_META[gi].ic} ${esc(g.name)} <small>${g.topics.length}</small></summary>
      ${g.topics.map(t => `<a class="mlink" href="#/topic/${t.id}">${t.ic} ${esc(t.t)}</a>`).join("")}</details>`).join("")}
    <div class="mtheme"><span>Giao diện</span><div class="seg" role="group" aria-label="Giao diện">${[["auto", "Tự động"], ["light", "Sáng"], ["dark", "Tối"]].map(([v, l]) => `<button type="button" data-th="${v}" class="${Store.get("theme", "auto") === v ? "on" : ""}">${l}</button>`).join("")}</div></div>
    <a class="mitem ext" target="_blank" rel="noopener" href="${OFFICIAL}">📖 Hướng dẫn gốc của VinFast ↗</a>
  </aside>`;
  document.body.appendChild(m);
  document.body.classList.add("nosc");
  m.querySelectorAll("[data-th]").forEach(b => b.onclick = () => { Store.set("theme", b.dataset.th); applyTheme(b.dataset.th); m.querySelectorAll("[data-th]").forEach(x => x.classList.toggle("on", x === b)); });
  m.querySelector(".mback").onclick = closeMenu;
  m.querySelector(".mclose").onclick = closeMenu;
  m.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { if (!a.target) closeMenu(); }));
}
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
window.addEventListener("hashchange", closeMenu);
