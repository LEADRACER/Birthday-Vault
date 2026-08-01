/* ═══════════════════════════════════════════════════
   Birthday:Vault — gallery, timeline, video hall, stats
   ═══════════════════════════════════════════════════ */
"use strict";

function filteredItems() {
  if (BV.filter === "all") return BV.items;
  return BV.items.filter(function (it) { return it.kind === BV.filter; });
}

function renderStats() {
  var photos = BV.items.filter(function (i) { return i.kind === "photo"; }).length;
  var videos = BV.items.filter(function (i) { return i.kind === "video"; }).length;
  $id("statPhotos").textContent = photos;
  $id("statVideos").textContent = videos;
  $id("statWishes").textContent = BV.wishes.length;
}

function cardHTML(it, idx) {
  var tag = '<span class="gcard-tag ' + (it.kind === "video" ? "video" : "") +
    '"><span class="dot"></span>' + (it.kind === "video" ? "Video" : "Photo") + "</span>";
  var drive = it.origin === "drive"
    ? '<span class="gcard-drive" title="Embedded from Google Drive">DRIVE</span>' : "";
  var play = it.kind === "video" ? '<div class="gcard-play"></div>' : "";
  var cls = it.ar === "portrait" ? "portrait" : "";
  var media;
  if (it.kind === "video") {
    var u = mediaURL(it);
    media = u ? '<video src="' + esc(u) + '" muted preload="metadata" tabindex="-1"></video>'
               : '<div style="height:100%;display:grid;place-items:center;color:var(--muted)">video</div>';
    if (it.origin === "drive") media = '<img src="' + esc(driveThumb(it.driveId)) + '" alt="" loading="lazy">';
  } else {
    var src = it.origin === "drive" ? driveThumb(it.driveId) : it.src;
    media = '<img src="' + esc(src) + '" alt="' + esc(it.title || "memory") +
            '" loading="lazy" tabindex="-1">';
  }
  return '<article class="gcard" data-kind="' + it.kind + '" data-id="' + esc(it.id) +
    '" style="animation-delay:' + Math.min(idx * 45, 500) + 'ms" tabindex="0" role="button" ' +
    'aria-label="View ' + esc(it.title || "memory") + '">' +
    '<div class="gcard-media ' + cls + '">' + media + tag + drive + play +
    '<button class="gcard-del" data-del="' + esc(it.id) + '" title="Delete" aria-label="Delete ' + esc(it.title || "memory") + '">✕</button>' +
    "</div>" +
    '<div class="gcard-body"><h3 class="gcard-title">' + esc(it.title || "Untitled") + "</h3>" +
    (it.caption ? '<p class="gcard-caption">' + esc(it.caption) + "</p>" : "") +
    '<span class="gcard-date">' + (fmtDate(it.date) || "—") + "</span></div></article>";
}

function renderGallery() {
  var grid = $id("galleryGrid");
  var list = filteredItems();
  $id("galleryEmpty").hidden = list.length > 0;
  grid.innerHTML = list.map(cardHTML).join("");
}

function renderTimeline() {
  var wrap = $id("timeline");
  var items = BV.items.slice().sort(function (a, b) {
    return (a.date || "") < (b.date || "") ? -1 : 1;
  });
  $id("timelineEmpty").hidden = items.length > 0;
  if (!items.length) { wrap.innerHTML = ""; return; }

  var html = "", lastYear = null;
  items.forEach(function (it) {
    var y = yearOf(it.date, it.addedAt);
    if (y !== lastYear) { html += '<div class="tl-year"><span>' + y + "</span></div>"; lastYear = y; }
    var thumb;
    if (it.kind === "photo") {
      var pSrc = it.origin === "drive" ? driveThumb(it.driveId) : it.src;
      thumb = '<img src="' + esc(pSrc) + '" alt="" loading="lazy">';
    } else {
      var u = it.origin === "drive" ? driveThumb(it.driveId) : mediaURL(it);
      thumb = u
        ? '<img src="' + esc(u) + '" alt="" loading="lazy" style="filter:brightness(.7)">'
        : '<div style="aspect-ratio:16/9;display:grid;place-items:center;background:#000;color:var(--muted)">▶ video</div>';
    }
    html += '<div class="tl-item"><div class="tl-card">' + thumb +
      '<div class="tl-body"><h4>' + esc(it.title || "Untitled") + "</h4>" +
      (it.caption ? "<p>" + esc(it.caption) + "</p>" : "") +
      '<span class="tl-date">' + (fmtDate(it.date) || "someday") + "</span></div></div></div>";
  });
  wrap.innerHTML = html;
}

function renderVideos() {
  var hall = $id("videoHall");
  var vids = BV.items.filter(function (i) { return i.kind === "video"; });
  $id("videosEmpty").hidden = vids.length > 0;
  hall.innerHTML = vids.map(function (it, idx) {
    var u = it.origin === "drive" ? null : mediaURL(it);
    var media;
    if (it.origin === "drive") {
      media = '<img src="' + esc(driveThumb(it.driveId)) + '" alt="" loading="lazy">';
    } else if (u) {
      media = '<video src="' + esc(u) + '" muted preload="metadata" tabindex="-1"></video>';
    } else {
      media = '<div style="display:grid;place-items:center;height:100%;color:var(--muted)">…</div>';
    }
    return '<article class="vcard" data-id="' + esc(it.id) + '" tabindex="0" role="button" ' +
      'aria-label="Play ' + esc(it.title || "video") + '" style="animation-delay:' + Math.min(idx * 60, 420) + 'ms">' +
      '<div class="vcard-media">' + media + '<div class="vcard-play"></div></div>' +
      '<div class="vcard-body"><h4>' + esc(it.title || "Untitled") + "</h4>" +
      (it.caption ? "<p>" + esc(it.caption) + "</p>" : "") +
      '<span class="vcard-src">' + (it.origin === "drive" ? "via Google Drive" : "uploaded") + "</span></div></article>";
  }).join("");
}

/* ── actions ── */
function deleteItem(id) {
  var it = BV.items.find(function (x) { return x.id === id; });
  if (!it) return;
  if (!window.confirm('Delete "' + (it.title || "this memory") + '" from the vault?')) return;
  revokeMedia(it);
  BV.items = BV.items.filter(function (x) { return x.id !== id; });
  idbDelete("items", id).then(function () {
    renderAll();
    showToast("Memory removed.");
  });
}

function clearSamples() {
  var demos = BV.items.filter(function (i) { return i.demo; });
  if (!demos.length) { showToast("No samples to clear."); return; }
  if (!window.confirm("Remove all sample artwork? Your own memories stay.")) return;
  demos.forEach(revokeMedia);
  BV.items = BV.items.filter(function (i) { return !i.demo; });
  Promise.all(demos.map(function (d) { return idbDelete("items", d.id); })).then(function () {
    renderAll();
    showToast("Samples cleared.");
  });
}

function emptyVault() {
  if (!BV.items.length) { showToast("Vault is already empty."); return; }
  if (!window.confirm("Empty the vault? This deletes every photo and video (wishes stay).")) return;
  BV.items.forEach(revokeMedia);
  BV.items = [];
  idbClear("items").then(function () {
    renderAll();
    showToast("Vault emptied.");
  });
}

/* delegation: card click opens lightbox, delete btn removes */
function wireGalleryEvents() {
  $id("galleryGrid").addEventListener("click", function (e) {
    var del = e.target.closest("[data-del]");
    if (del) { e.stopPropagation(); deleteItem(del.getAttribute("data-del")); return; }
    var card = e.target.closest(".gcard");
    if (card) openLightbox(card.getAttribute("data-id"));
  });
  $id("galleryGrid").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".gcard");
    if (card) { e.preventDefault(); openLightbox(card.getAttribute("data-id")); }
  });
  $id("videoHall").addEventListener("click", function (e) {
    var card = e.target.closest(".vcard");
    if (card) openLightbox(card.getAttribute("data-id"));
  });
  $id("videoHall").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".vcard");
    if (card) { e.preventDefault(); openLightbox(card.getAttribute("data-id")); }
  });

  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("active"); b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active"); btn.setAttribute("aria-selected", "true");
      BV.filter = btn.getAttribute("data-filter");
      renderGallery();
    });
  });

  $id("btnClearSamples").addEventListener("click", clearSamples);
  $id("btnClearAll").addEventListener("click", emptyVault);
  $id("btnEmptyAdd").addEventListener("click", function () { openUploadModal(); });
  $id("btnEmptyVideo").addEventListener("click", function () { openUploadModal("video"); });
}

function renderAll() {
  renderStats();
  renderGallery();
  renderTimeline();
  renderVideos();
  renderWishes();
  if (typeof refreshShowcases === "function") refreshShowcases();
}
