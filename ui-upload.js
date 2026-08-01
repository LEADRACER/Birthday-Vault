/* ═══════════════════════════════════════════════════
   Birthday:Vault — upload modal (files + Google Drive)
   ═══════════════════════════════════════════════════ */
"use strict";

var UPLOAD_QUEUE = [];   // {id, file, kind, title, caption, date, thumb, preview}
var DRIVE_KIND = "photo";

function openUploadModal(tab) {
  $id("uploadModal").hidden = false;
  document.body.style.overflow = "hidden";
  if (tab === "video") { DRIVE_KIND = "video"; syncDriveKind(); }
  if (tab === "drive") switchTab("drive");
}
function closeUploadModal() {
  $id("uploadModal").hidden = true;
  document.body.style.overflow = "";
}

function switchTab(name) {
  document.querySelectorAll(".modal-tab").forEach(function (t) {
    var on = t.getAttribute("data-tab") === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  $id("tabUpload").hidden = name !== "upload";
  $id("tabDrive").hidden = name !== "drive";
}

/* ── image compression (max 1920px, JPEG 0.82) ── */
function compressImage(file) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var MAX = 1920;
      var w = img.naturalWidth, h = img.naturalHeight;
      var ar = w > h ? "landscape" : (h > w ? "portrait" : "square");
      var scale = Math.min(1, MAX / Math.max(w, h));
      var cw = Math.round(w * scale), ch = Math.round(h * scale);
      var c = document.createElement("canvas");
      c.width = cw; c.height = ch;
      c.getContext("2d").drawImage(img, 0, 0, cw, ch);
      URL.revokeObjectURL(url);
      resolve({ data: c.toDataURL("image/jpeg", 0.82), ar: ar });
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Unreadable image: " + file.name)); };
    img.src = url;
  });
}

function addFilesToQueue(files) {
  Array.prototype.forEach.call(files, function (file) {
    var isImg = file.type.startsWith("image/");
    var isVid = file.type.startsWith("video/");
    if (!isImg && !isVid) { showToast("Skipped " + file.name + " — not an image or video.", "err"); return; }
    if (isVid && file.size > 150 * 1024 * 1024) {
      showToast(file.name + " is over 150 MB — Drive links are better for big files.", "err"); return;
    }
    if (UPLOAD_QUEUE.length >= 12) { showToast("Max 12 files per batch.", "err"); return; }
    var entry = {
      id: uid(), file: file, kind: isVid ? "video" : "photo",
      title: "", caption: "", date: "", thumb: null, preview: null, ar: "landscape"
    };
    if (isImg) {
      entry.thumb = URL.createObjectURL(file);
    } else {
      entry.thumb = null;
      var v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.onloadedmetadata = function () {
        try { v.currentTime = Math.min(1, v.duration / 2); } catch (e) {}
        v.ontimeupdate = function () {
          try {
            var c = document.createElement("canvas");
            c.width = 320; c.height = 180;
            c.getContext("2d").drawImage(v, 0, 0, 320, 180);
            entry.thumb = c.toDataURL("image/jpeg", 0.6);
            renderQueue();
          } catch (e) {}
        };
      };
      v.src = URL.createObjectURL(file);
    }
    UPLOAD_QUEUE.push(entry);
  });
  renderQueue();
}

function renderQueue() {
  var wrap = $id("uploadQueue");
  var note = $id("queueNote");
  if (!UPLOAD_QUEUE.length) {
    wrap.innerHTML = "";
    $id("btnSaveAll").disabled = true;
    note.textContent = "Photos are auto-compressed. Videos are stored as-is (keep them under ~100 MB).";
    return;
  }
  note.textContent = UPLOAD_QUEUE.length + " file" + (UPLOAD_QUEUE.length > 1 ? "s" : "") +
    " ready — add titles & dates, then save.";
  $id("btnSaveAll").disabled = false;
  wrap.innerHTML = UPLOAD_QUEUE.map(function (q) {
    var thumb = q.thumb ? '<img class="uq-thumb" src="' + esc(q.thumb) + '" alt="">'
                        : '<div class="uq-thumb" style="display:grid;place-items:center;color:var(--muted);font-size:11px">video</div>';
    return '<div class="uq-item" data-qid="' + q.id + '">' + thumb +
      '<div class="uq-info"><span class="uq-name">' + esc(q.file.name) + " · " + q.kind +
      (q.file.size > 1024 * 1024 ? " · " + (q.file.size / 1048576).toFixed(1) + " MB" : "") + "</span>" +
      '<div class="uq-fields">' +
      '<input type="text" placeholder="Title" maxlength="80" data-f="title" value="' + esc(q.title) + '">' +
      '<input type="date" data-f="date" value="' + esc(q.date) + '">' +
      "</div></div>" +
      '<button class="uq-remove" data-qrm="' + q.id + '" aria-label="Remove from queue">✕</button></div>';
  }).join("");
}

function saveQueue() {
  if (!UPLOAD_QUEUE.length) return;
  var btn = $id("btnSaveAll");
  btn.disabled = true;
  btn.textContent = "Saving…";

  var jobs = UPLOAD_QUEUE.map(function (q) {
    if (q.kind === "photo") {
      return compressImage(q.file).then(function (r) {
        return {
          id: q.id, kind: "photo", origin: "upload",
          src: r.data, ar: r.ar,
          title: q.title.trim(), caption: q.caption.trim(), date: q.date, addedAt: Date.now()
        };
      });
    }
    return Promise.resolve({
      id: q.id, kind: "video", origin: "upload",
      src: q.file, ar: "landscape",
      title: q.title.trim(), caption: q.caption.trim(), date: q.date, addedAt: Date.now()
    });
  });

  Promise.all(jobs).then(function (items) {
    return Promise.all(items.map(function (it) { return idbPut("items", it); })).then(function () {
      UPLOAD_QUEUE.forEach(function (q) { if (q.thumb && q.thumb.startsWith("blob:")) URL.revokeObjectURL(q.thumb); });
      UPLOAD_QUEUE = [];
      renderQueue();
      closeUploadModal();
      return loadAll().then(function () {
        renderAll();
        showToast(items.length + " memor" + (items.length > 1 ? "ies" : "y") + " vaulted ✦");
      });
    });
  }).catch(function (err) {
    showToast("Save failed: " + err.message, "err");
  }).finally(function () {
    btn.disabled = false;
    btn.textContent = "Save to vault";
  });
}

/* ── Google Drive tab ── */
function syncDriveKind() {
  var el = document.querySelector('input[name="driveKind"]:checked');
  DRIVE_KIND = el ? el.value : "photo";
}

function drivePreview() {
  var id = parseDriveLink($id("driveLink").value);
  var box = $id("drivePreview");
  if (!id) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  if (DRIVE_KIND === "video") {
    box.innerHTML = '<iframe src="' + esc(driveEmbed(id)) + '" allow="autoplay; fullscreen" allowfullscreen title="Drive preview"></iframe>';
  } else {
    box.innerHTML = '<img src="' + esc(driveThumb(id)) + '" alt="Drive preview">';
  }
}

function addFromDrive() {
  var raw = $id("driveLink").value.trim();
  var id = parseDriveLink(raw);
  if (!id) { showToast("That doesn't look like a Google Drive file link.", "err"); return; }
  var item = {
    id: uid(),
    kind: DRIVE_KIND,
    origin: "drive",
    driveId: id,
    src: null,
    ar: DRIVE_KIND === "video" ? "landscape" : "landscape",
    title: $id("driveTitle").value.trim(),
    caption: "",
    date: $id("driveDate").value,
    addedAt: Date.now()
  };
  idbPut("items", item).then(function () {
    closeUploadModal();
    $id("driveLink").value = "";
    $id("driveTitle").value = "";
    $id("driveDate").value = "";
    $id("drivePreview").hidden = true;
    $id("drivePreview").innerHTML = "";
    return loadAll().then(function () {
      renderAll();
      showToast("Linked from Google Drive ✦");
    });
  });
}

function wireUploadEvents() {
  $id("btnAddTop").addEventListener("click", function () { openUploadModal(); });
  $id("btnAddHero").addEventListener("click", function () { openUploadModal(); });
  $id("modalClose").addEventListener("click", closeUploadModal);
  $id("uploadModal").addEventListener("click", function (e) {
    if (e.target === $id("uploadModal")) closeUploadModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !$id("uploadModal").hidden) closeUploadModal();
  });

  document.querySelectorAll(".modal-tab").forEach(function (t) {
    t.addEventListener("click", function () { switchTab(t.getAttribute("data-tab")); });
  });

  /* dropzone */
  var dz = $id("dropzone"), fi = $id("fileInput");
  dz.addEventListener("click", function () { fi.click(); });
  dz.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fi.click(); }
  });
  fi.addEventListener("change", function () { addFilesToQueue(fi.files); fi.value = ""; });
  ["dragenter", "dragover"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("dragover"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("dragover"); });
  });
  dz.addEventListener("drop", function (e) { addFilesToQueue(e.dataTransfer.files); });

  /* queue editing */
  $id("uploadQueue").addEventListener("input", function (e) {
    var q = UPLOAD_QUEUE.find(function (x) { return x.id === e.target.closest("[data-qid]").getAttribute("data-qid"); });
    if (!q) return;
    q[e.target.getAttribute("data-f")] = e.target.value;
  });
  $id("uploadQueue").addEventListener("click", function (e) {
    var rm = e.target.closest("[data-qrm]");
    if (!rm) return;
    var qid = rm.getAttribute("data-qrm");
    var q = UPLOAD_QUEUE.find(function (x) { return x.id === qid; });
    if (q && q.thumb && q.thumb.startsWith("blob:")) URL.revokeObjectURL(q.thumb);
    UPLOAD_QUEUE = UPLOAD_QUEUE.filter(function (x) { return x.id !== qid; });
    renderQueue();
  });

  $id("btnSaveAll").addEventListener("click", saveQueue);

  /* drive tab */
  document.querySelectorAll('input[name="driveKind"]').forEach(function (r) {
    r.addEventListener("change", function () { syncDriveKind(); drivePreview(); });
  });
  $id("driveLink").addEventListener("input", drivePreview);
  $id("btnAddDrive").addEventListener("click", addFromDrive);
}
