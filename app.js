/* ═══════════════════════════════════════════════════
   Birthday:Vault — core (config, state, IndexedDB, utils)
   ═══════════════════════════════════════════════════ */
"use strict";

/* ── EDIT ME ─────────────────────────────────────────
   name:     whose birthday is this (shown in the hero)
   birthday: ISO date "YYYY-MM-DD" — powers the age badge
             and the "next lap" countdown. Empty = hidden.
   ─────────────────────────────────────────────────── */
var BV_CONFIG = {
  name: "",
  birthday: ""
};

/* ── Load config from config.js (injected at build time) ── */
function loadBuildConfig() {
  if (window.BV_ENV_CONFIG) {
    if (window.BV_ENV_CONFIG.name && window.BV_ENV_CONFIG.name !== "__BV_NAME__") {
      BV_CONFIG.name = window.BV_ENV_CONFIG.name;
    }
    if (window.BV_ENV_CONFIG.birthday && window.BV_ENV_CONFIG.birthday !== "__BV_BIRTHDAY__") {
      BV_CONFIG.birthday = window.BV_ENV_CONFIG.birthday;
    }
  }
}

/* Call immediately so BV_CONFIG is ready for applyConfig() */
loadBuildConfig();

var BV = {
  items: [],
  wishes: [],
  filter: "all",
  lbList: [],
  lbIndex: 0,
  urlCache: {},
  db: null,
  dbReady: null
};

/* ── tiny utils ── */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function uid() {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function $id(id) { return document.getElementById(id); }

function fmtDate(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function yearOf(iso, fallback) {
  if (iso) { var y = parseInt(String(iso).slice(0, 4), 10); if (y > 1900 && y < 2100) return y; }
  return new Date(fallback || Date.now()).getFullYear();
}

function showToast(msg, type) {
  var box = $id("toasts");
  var el = document.createElement("div");
  el.className = "toast " + (type === "err" ? "err" : "ok");
  el.innerHTML = '<span class="t-mark">' + (type === "err" ? "✕" : "✦") + "</span><span>" + esc(msg) + "</span>";
  box.appendChild(el);
  setTimeout(function () {
    el.classList.add("out");
    setTimeout(function () { el.remove(); }, 260);
  }, 3400);
}

/* ── Google Drive link parsing ── */
function parseDriveLink(url) {
  try {
    var u = new URL(url.trim());
    if (!u.hostname.includes("drive.google.com") && !u.hostname.includes("docs.google.com")) return null;
    var m = u.pathname.match(/\/file\/d\/([^/]+)/) || u.pathname.match(/\/document\/d\/([^/]+)/);
    if (m) return m[1];
    m = u.searchParams.get("id");
    if (m) return m;
    if (u.pathname.includes("open")) return null;
  } catch (e) { /* fall through */ }
  return null;
}
function driveThumb(id) {
  return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w2000";
}
function driveEmbed(id) {
  return "https://drive.google.com/file/d/" + encodeURIComponent(id) + "/preview";
}

/* ── IndexedDB ── */
function openDB() {
  if (BV.dbReady) return BV.dbReady;
  BV.dbReady = new Promise(function (resolve, reject) {
    var req = indexedDB.open("birthday-vault", 1);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains("items")) db.createObjectStore("items", { keyPath: "id" });
      if (!db.objectStoreNames.contains("wishes")) db.createObjectStore("wishes", { keyPath: "id" });
    };
    req.onsuccess = function (e) { BV.db = e.target.result; resolve(BV.db); };
    req.onerror = function () { reject(req.error); };
  });
  return BV.dbReady;
}

function idbGetAll(store) {
  return openDB().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction(store, "readonly");
      var rq = tx.objectStore(store).getAll();
      rq.onsuccess = function () { res(rq.result || []); };
      rq.onerror = function () { rej(rq.error); };
    });
  });
}
function idbPut(store, val) {
  return openDB().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(val);
      tx.oncomplete = function () { res(); };
      tx.onerror = function () { rej(tx.error); };
    });
  });
}
function idbDelete(store, key) {
  return openDB().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = function () { res(); };
      tx.onerror = function () { rej(tx.error); };
    });
  });
}
function idbClear(store) {
  return openDB().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction(store, "readwrite");
      tx.objectStore(store).clear();
      tx.oncomplete = function () { res(); };
      tx.onerror = function () { rej(tx.error); };
    });
  });
}

/* ── object URLs for stored video blobs ── */
function mediaURL(item) {
  if (item.origin === "drive") return null;                 // drive items embed directly
  if (typeof item.src === "string") return item.src;        // image data URL
  if (item.src instanceof Blob) {                           // video blob
    if (BV.urlCache[item.id]) return BV.urlCache[item.id];
    var u = URL.createObjectURL(item.src);
    BV.urlCache[item.id] = u;
    return u;
  }
  return null;
}
function revokeMedia(item) {
  if (BV.urlCache[item.id]) { URL.revokeObjectURL(BV.urlCache[item.id]); delete BV.urlCache[item.id]; }
}

/* ── demo seed (sample artwork, clearly marked) ── */
var DEMO_ITEMS = [
  { id: "demo-candles", kind: "photo", origin: "upload", demo: true, ar: "landscape",
    src: "assets/demo/candles.svg", title: "The candles", caption: "Another year, same light.",
    date: "", addedAt: 1 },
  { id: "demo-sparkler", kind: "photo", origin: "upload", demo: true, ar: "portrait",
    src: "assets/demo/sparkler.svg", title: "Sparkler season", caption: "Wishes made at midnight.",
    date: "", addedAt: 2 },
  { id: "demo-confetti", kind: "photo", origin: "upload", demo: true, ar: "landscape",
    src: "assets/demo/confetti.svg", title: "Golden hour", caption: "Confetti never lies.",
    date: "", addedAt: 3 },
  { id: "demo-polaroids", kind: "photo", origin: "upload", demo: true, ar: "portrait",
    src: "assets/demo/polaroids.svg", title: "The prints", caption: "The ones we kept.",
    date: "", addedAt: 4 },
  { id: "demo-road", kind: "photo", origin: "upload", demo: true, ar: "landscape",
    src: "assets/demo/road.svg", title: "On the road", caption: "Wherever the sun went, we went.",
    date: "", addedAt: 5 },
  { id: "demo-balloon", kind: "photo", origin: "upload", demo: true, ar: "portrait",
    src: "assets/demo/balloon.svg", title: "The balloon", caption: "One up, and one more year.",
    date: "", addedAt: 6 }
];

function seedDemo() {
  return idbGetAll("items").then(function (existing) {
    if (existing.length) return;
    var writes = DEMO_ITEMS.map(function (it) { return idbPut("items", it); });
    return Promise.all(writes).then(function () {
      showToast("Sample artwork loaded — add your real memories, or clear samples from the toolbar.");
    });
  });
}

/* ── load everything ── */
function loadAll() {
  return Promise.all([idbGetAll("items"), idbGetAll("wishes")]).then(function (res) {
    BV.items = res[0].sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });
    BV.wishes = res[1].sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  });
}
