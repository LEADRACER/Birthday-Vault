/* ═══════════════════════════════════════════════════
   Birthday:Vault — animated showcase
   hero spotlight (drifting stack) + the auto-playing reel
   ═══════════════════════════════════════════════════ */
"use strict";

var REEL_COLORS = ["#FF5C5C", "#FF9F1C", "#FFD60A", "#A78BFA", "#2DD4BF", "#5BC8F5", "#FF8FAB"];

function accent(i) { return REEL_COLORS[i % REEL_COLORS.length]; }

/* media source for showcase frames (drive photos → thumb CDN) */
function frameSrc(it) {
  if (it.origin === "drive") return driveThumb(it.driveId);
  return it.src || "";
}

/* ── hero spotlight: newest up to 6 items as a drifting polaroid stack ── */
function renderSpotlight() {
  var spot = $id("spotlight");
  if (!spot) return;
  var items = BV.items.slice().sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); }).slice(0, 6);
  if (!items.length) { spot.innerHTML = ""; return; }
  var rots = [-13, -7, 0, 7, 12, -3];
  spot.innerHTML = items.map(function (it, i) {
    var src = frameSrc(it);
    var med = it.kind === "video"
      ? '<div class="spot-video"><span>▶</span></div>'
      : '<img src="' + esc(src) + '" alt="' + esc(it.title || "memory") + '" loading="lazy">';
    return '<button class="spot-card" data-open="' + esc(it.id) + '" style="--r:' + rots[i % rots.length] +
      'deg;--acc:' + accent(i) + ';animation-delay:' + (i * 0.55) + 's;animation-duration:' + (5 + (i % 4)) + 's">' +
      '<span class="spot-tape" style="background:' + accent(i + 1) + '"></span>' + med +
      '<span class="spot-cap">' + esc(it.title || "") + "</span></button>";
  }).join("");
}

/* ── the reel: continuous filmstrip of every memory ── */
function renderReel() {
  var track = $id("reelTrack");
  var empty = $id("reelEmpty");
  if (!track) return;
  var items = BV.items.slice().sort(function (a, b) { return (a.addedAt || 0) - (b.addedAt || 0); });
  if (!items.length) {
    track.innerHTML = "";
    if (empty) empty.hidden = false;
    $id("reelWrap").classList.add("is-empty");
    return;
  }
  if (empty) empty.hidden = true;
  $id("reelWrap").classList.remove("is-empty");
  var html = items.map(function (it, i) {
    var src = frameSrc(it);
    var med = it.kind === "video"
      ? '<div class="reel-video"><span>▶</span></div>'
      : '<img src="' + esc(src) + '" alt="' + esc(it.title || "memory") + '" loading="lazy">';
    return '<button class="reel-frame" data-open="' + esc(it.id) + '" style="--acc:' + accent(i) + '">' +
      '<span class="reel-tape" style="background:' + accent(i + 1) + '"></span>' + med +
      '<span class="reel-cap">' + esc(it.title || "") + "</span></button>";
  }).join("");
  /* duplicate once for a seamless loop */
  track.innerHTML = html + html;
  seekReel(0, true);
}

/* ── auto-advance ── */
var REEL_TICK = 2600;
var reelTimer = null;

function reelStep() {
  var vp = $id("reelViewport");
  if (!vp || vp.classList.contains("paused")) return;
  var step = 280; /* card width + gap */
  var at = vp.scrollLeft;
  var target = at + step;
  if (target >= vp.scrollWidth - vp.clientWidth - 8) target = 0;
  vp.scrollTo({ left: target, behavior: "smooth" });
}

function seekReel(target, instant) {
  var vp = $id("reelViewport");
  if (!vp) return;
  if (instant) { vp.scrollLeft = 0; return; }
  var step = 280;
  var at = vp.scrollLeft;
  var next = Math.max(0, Math.min(target === 1 ? at + step : at - step, vp.scrollWidth - vp.clientWidth));
  vp.scrollTo({ left: next, behavior: "smooth" });
}

function wireReelEvents() {
  var vp = $id("reelViewport");
  if (!vp) return;
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reelTimer = setInterval(reelStep, REEL_TICK);
  }
  vp.addEventListener("mouseenter", function () { vp.classList.add("paused"); });
  vp.addEventListener("mouseleave", function () { vp.classList.remove("paused"); });
  vp.addEventListener("focusin", function () { vp.classList.add("paused"); });
  vp.addEventListener("focusout", function () { vp.classList.remove("paused"); });
  vp.addEventListener("touchstart", function () { vp.classList.add("paused"); }, { passive: true });
  vp.addEventListener("touchend", function () { setTimeout(function () { vp.classList.remove("paused"); }, 3000); }, { passive: true });
  $id("reelNext").addEventListener("click", function () { seekReel(1); });
  $id("reelPrev").addEventListener("click", function () { seekReel(-1); });

  /* open any frame in the lightbox */
  [vp, $id("spotlight")].forEach(function (root) {
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-open]");
      if (b) openLightbox(b.getAttribute("data-open"));
    });
  });
}

function refreshShowcases() {
  renderSpotlight();
  renderReel();
}
