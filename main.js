/* ═══════════════════════════════════════════════════
   Birthday:Vault — boot, hero, sparkles, confetti,
   countdown, export/import, header scroll
   ═══════════════════════════════════════════════════ */
"use strict";

/* ── hero copy from config ── */
function applyConfig() {
  var name = BV_CONFIG.name.trim();
  var bd = BV_CONFIG.birthday.trim();
  var nameEl = $id("heroName");
  var badge = $id("heroBadge");
  var count = $id("heroCount");

  if (name) {
    nameEl.innerHTML = esc(name.split(" ")[0]) + "<br><em>" + esc(name.split(" ").slice(1).join(" ") || "of many years") + "</em>";
  } else {
    nameEl.innerHTML = "Another<br><em>Year of You</em>";
  }
  $id("heroEyebrow").textContent = name ? "A celebration of" : "A celebration of";

  if (bd && /^\d{4}-\d{2}-\d{2}$/.test(bd)) {
    var now = new Date();
    var thisYear = new Date(now.getFullYear(), parseInt(bd.slice(5, 7), 10) - 1, parseInt(bd.slice(8, 10), 10));
    var age = now.getFullYear() - parseInt(bd.slice(0, 4), 10) - (now < thisYear ? 1 : 0);
    badge.textContent = "✦ Turning " + (age + 1);
    $id("heroDate").textContent = "· " + thisYear.toLocaleDateString(undefined, { month: "long", day: "numeric" });

    var next = new Date(now.getFullYear(), thisYear.getMonth(), thisYear.getDate());
    if (next <= now) next = new Date(now.getFullYear() + 1, thisYear.getMonth(), thisYear.getDate());
    var days = Math.ceil((next - now) / 86400000);
    if (days === 0) count.textContent = "It's the day — light the candles";
    else if (days === 1) count.textContent = "The next lap starts tomorrow";
    else count.textContent = "Next lap around the sun in " + days + " days";
    count.style.display = "";
  } else {
    badge.textContent = "✦ A celebration";
    $id("heroDate").textContent = "· the whole story below";
    count.style.display = "none";
  }
}

/* ── floating sparks ── */
function spawnSparks() {
  var field = $id("sparkField");
  if (!field) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var frag = document.createDocumentFragment();
  for (var i = 0; i < 26; i++) {
    var s = document.createElement("span");
    s.className = "spark";
    s.style.left = (Math.random() * 100).toFixed(2) + "%";
    s.style.top = (30 + Math.random() * 65).toFixed(2) + "%";
    s.style.animationDuration = (5 + Math.random() * 7).toFixed(2) + "s";
    s.style.animationDelay = (Math.random() * 8).toFixed(2) + "s";
    s.style.width = s.style.height = (2 + Math.random() * 3).toFixed(1) + "px";
    frag.appendChild(s);
  }
  field.appendChild(frag);
}

/* ── confetti burst (once per visit) ── */
function confettiBurst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (sessionStorage.getItem("bv_confetti")) return;
  sessionStorage.setItem("bv_confetti", "1");

  var canvas = document.createElement("canvas");
  canvas.id = "confettiCanvas";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var W = canvas.width = window.innerWidth;
  var H = canvas.height = window.innerHeight;
  var colors = ["#FF5C5C", "#FF9F1C", "#FFD60A", "#A78BFA", "#2DD4BF", "#5BC8F5", "#FF8FAB"];
  var parts = [];
  for (var i = 0; i < 140; i++) {
    parts.push({
      x: W / 2 + (Math.random() - 0.5) * 160,
      y: H * 0.42 + (Math.random() - 0.5) * 120,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 11 - 3,
      g: 0.24 + Math.random() * 0.12,
      s: 5 + Math.random() * 7,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0]
    });
  }
  var t0 = performance.now();
  function frame(t) {
    var el = t - t0;
    if (el > 4200) { canvas.remove(); return; }
    ctx.clearRect(0, 0, W, H);
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - el / 4200);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ── export / import ── */
function exportBackup() {
  var payload = {
    app: "Birthday:Vault", version: 1, exportedAt: new Date().toISOString(),
    config: BV_CONFIG, items: [], wishes: BV.wishes
  };
  var skipped = 0;
  BV.items.forEach(function (it) {
    var copy = JSON.parse(JSON.stringify(Object.assign({}, it, { src: null })));
    if (it.src instanceof Blob) {
      if (it.src.size <= 20 * 1024 * 1024) {
        var reader = new FileReader();
        reader.readAsDataURL(it.src);
        // sync path below handles it via promise chaining instead
        copy._pending = reader;
      } else {
        copy.videoSkipped = true; copy.videoSize = it.src.size; skipped++;
      }
    } else {
      copy.src = it.src;
    }
    payload.items.push(copy);
  });
  if (skipped) showToast(skipped + " video(s) too big for export — Drive links survive exports.", "err");

  var withBlobs = payload.items.filter(function (i) { return i._pending; });
  var base = payload.items.filter(function (i) { return !i._pending; });

  var finish = function () {
    var json = JSON.stringify(Object.assign({}, payload, { items: base }), null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "birthday-vault-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
    showToast("Backup exported. Keep it safe.");
  };

  if (!withBlobs.length) { finish(); return; }
  var done = 0;
  withBlobs.forEach(function (copy) {
    copy._pending.onload = function () {
      copy.src = copy._pending.result;
      delete copy._pending;
      base.push(copy);
      if (++done === withBlobs.length) finish();
    };
  });
}

function importBackup(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(reader.result);
      if (!data || data.app !== "Birthday:Vault" || !Array.isArray(data.items)) {
        throw new Error("not a Birthday:Vault backup");
      }
      var items = data.items.filter(function (i) { return i && i.id; });
      var wishes = Array.isArray(data.wishes) ? data.wishes : [];
      Promise.all(items.map(function (i) { return idbPut("items", i); }))
        .then(function () { return Promise.all(wishes.map(function (w) { return idbPut("wishes", w); })); })
        .then(function () { return loadAll(); })
        .then(function () {
          renderAll();
          showToast("Backup restored — " + items.length + " items, " + wishes.length + " wishes.");
        });
    } catch (err) {
      showToast("Import failed: " + err.message, "err");
    }
  };
  reader.readAsText(file);
}

/* ── header scroll state + marquee duplication ── */
function wireChrome() {
  var header = $id("siteHeader");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* duplicate marquee track so the loop is seamless */
  var track = document.querySelector(".marquee-track");
  if (track) track.innerHTML += track.innerHTML;

  $id("btnExport").addEventListener("click", exportBackup);
  $id("btnExport2").addEventListener("click", exportBackup);
  $id("btnImport").addEventListener("click", function () { $id("importFile").click(); });
  $id("importFile").addEventListener("change", function (e) {
    if (e.target.files[0]) importBackup(e.target.files[0]);
    e.target.value = "";
  });
}

/* ── boot ── */
function init() {
  applyConfig();
  spawnSparks();
  wireChrome();
  wireGalleryEvents();
  wireLightboxEvents();
  wireUploadEvents();
  wireWishEvents();
  wireReelEvents();

  openDB()
    .then(seedDemo)
    .then(loadAll)
    .then(renderAll)
    .then(function () {
      confettiBurst();
      renderStats();
    })
    .catch(function (err) {
      showToast("Storage failed: " + err.message + " — try a modern browser.", "err");
    });
}

document.addEventListener("DOMContentLoaded", init);
