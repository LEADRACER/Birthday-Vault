/* ═══════════════════════════════════════════════════
   Birthday:Vault — wishes wall
   ═══════════════════════════════════════════════════ */
"use strict";

function renderWishes() {
  var wall = $id("wishWall");
  if (!BV.wishes.length) {
    wall.innerHTML = '<div class="empty-state empty-state-small"><p>No wishes yet — be the first to sign the wall.</p></div>';
    return;
  }
  wall.innerHTML = BV.wishes.map(function (w, i) {
    var d = new Date(w.ts);
    var when = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    return '<div class="wish-card" style="animation-delay:' + Math.min(i * 50, 350) + 'ms">' +
      "<p>" + esc(w.message) + "</p>" +
      "<footer><span>" + esc(w.name || "Anonymous") + "</span><span>·</span><span>" + when + "</span>" +
      '<button class="wish-del" data-wdel="' + esc(w.id) + '" title="Delete wish" aria-label="Delete wish by ' + esc(w.name || "Anonymous") + '">✕</button>' +
      "</footer></div>";
  }).join("");
}

function addWish(name, message) {
  var w = { id: uid(), name: name, message: message, ts: Date.now() };
  return idbPut("wishes", w).then(function () {
    BV.wishes.unshift(w);
    renderWishes();
    renderStats();
  });
}

function deleteWish(id) {
  BV.wishes = BV.wishes.filter(function (w) { return w.id !== id; });
  return idbDelete("wishes", id).then(function () {
    renderWishes();
    renderStats();
    showToast("Wish removed.");
  });
}

function wireWishEvents() {
  $id("wishForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $id("wishName").value.trim();
    var msg = $id("wishMsg").value.trim();
    if (!msg) { showToast("Write a wish first.", "err"); return; }
    addWish(name || "Anonymous", msg).then(function () {
      $id("wishName").value = "";
      $id("wishMsg").value = "";
      showToast("Wish posted to the wall ✦");
    });
  });
  $id("wishWall").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-wdel]");
    if (!btn) return;
    if (window.confirm("Remove this wish?")) deleteWish(btn.getAttribute("data-wdel"));
  });
}
