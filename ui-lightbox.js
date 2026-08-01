/* ═══════════════════════════════════════════════════
   Birthday:Vault — lightbox viewer
   ═══════════════════════════════════════════════════ */
"use strict";

function openLightbox(id) {
  BV.lbList = filteredItems();
  BV.lbIndex = BV.lbList.findIndex(function (i) { return i.id === id; });
  if (BV.lbIndex < 0) BV.lbIndex = 0;
  if (!BV.lbList.length) return;
  $id("lightbox").hidden = false;
  document.body.style.overflow = "hidden";
  lbRender();
}

function lbClose() {
  $id("lightbox").hidden = true;
  document.body.style.overflow = "";
  var stage = $id("lbStage");
  var v = stage.querySelector("video");
  if (v) v.pause();
  stage.innerHTML = "";
}

function lbRender() {
  var it = BV.lbList[BV.lbIndex];
  var stage = $id("lbStage");
  stage.innerHTML = "";

  var el;
  if (it.kind === "video" && it.origin === "drive") {
    el = document.createElement("iframe");
    el.src = driveEmbed(it.driveId);
    el.allow = "autoplay; fullscreen";
    el.allowFullscreen = true;
    el.title = it.title || "video";
  } else if (it.kind === "video") {
    var u = mediaURL(it);
    el = document.createElement("video");
    el.src = u;
    el.controls = true;
    el.autoplay = true;
    el.title = it.title || "video";
  } else {
    el = document.createElement("img");
    el.src = it.src;
    el.alt = it.title || "memory";
  }
  stage.appendChild(el);

  var cap = $id("lbCaption");
  cap.innerHTML = "<span>" + esc(it.title || "Untitled") + "</span>" +
    (it.caption ? " — " + esc(it.caption) : "") +
    "<small>" + (fmtDate(it.date) || "a memory") +
    (it.origin === "drive" ? " · via Google Drive" : "") + "</small>";

  $id("lbCounter").textContent = (BV.lbIndex + 1) + " / " + BV.lbList.length;
}

function lbStep(dir) {
  var v = $id("lbStage").querySelector("video");
  if (v) v.pause();
  BV.lbIndex = (BV.lbIndex + dir + BV.lbList.length) % BV.lbList.length;
  lbRender();
}

function wireLightboxEvents() {
  $id("lbClose").addEventListener("click", lbClose);
  $id("lbPrev").addEventListener("click", function () { lbStep(-1); });
  $id("lbNext").addEventListener("click", function () { lbStep(1); });
  $id("lightbox").addEventListener("click", function (e) {
    if (e.target === $id("lightbox")) lbClose();
  });
  document.addEventListener("keydown", function (e) {
    if ($id("lightbox").hidden) return;
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowLeft") lbStep(-1);
    else if (e.key === "ArrowRight") lbStep(1);
  });
}
