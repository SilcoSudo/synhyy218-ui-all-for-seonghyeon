import { db, isFirebaseConfigured, observeAuth, signInWithGoogle, signOutUser } from "../firebase.js";
import { doc, getDoc, Timestamp, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const ALLOWED = new Set([
  "captions", "events", "comment_platforms",
  "comment_templates", "missions", "announcements"
]);
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DOCS = 1000;
const PROJECT_ID = "all-for-eom-seonghyeon-651f9";
let currentUser = null;
let parsed = null;
let busy = false;
let publishing = false;
const log = message => { $("result").textContent = message; };
const message = text => { $("preview-message").textContent = text; };

function validateSeed(seed) {
  if (!seed || typeof seed !== "object" || Array.isArray(seed) || seed.schemaVersion !== 1)
    throw Error("Sai định dạng: cần schemaVersion = 1.");
  if (!seed.collections || typeof seed.collections !== "object" || Array.isArray(seed.collections))
    throw Error("Không tìm thấy collections.");
  const entries = [];
  const counts = {};
  for (const [path, records] of Object.entries(seed.collections)) {
    const eventCaptions = /^events\/[A-Za-z0-9_-]{1,100}\/captions$/.test(path);
    if (!ALLOWED.has(path) && !eventCaptions) throw Error("Collection không được hỗ trợ: " + path);
    if (!Array.isArray(records)) throw Error("Collection phải là mảng: " + path);
    counts[path] = records.length;
    for (const record of records) {
      if (!record || typeof record !== "object" || Array.isArray(record))
        throw Error("Document không hợp lệ trong " + path);
      const { id, ...data } = record;
      if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(id))
        throw Error("Document ID không hợp lệ trong " + path);
      if (!("text" in data) && !("title" in data))
        throw Error("Document thiếu nội dung trong " + path + "/" + id);
      if (path === "events") {
        const { startsAt, endsAt, startDate, endDate } = data;
        const start = Date.parse(startsAt ?? (startDate + "T00:00:00+07:00"));
        const end = endsAt === undefined
          ? Date.parse(endDate + "T00:00:00+07:00") + 86400000
          : Date.parse(endsAt);
        if (!(start < end) || !Number.isInteger(data.requiredCopies) || data.requiredCopies < 1)
          throw Error("Thời gian hoặc số caption mục tiêu không hợp lệ: " + id);
        data.startsAt = Timestamp.fromMillis(start);
        data.endsAt = Timestamp.fromMillis(end);
        data.status ??= "draft";
        if (!["draft", "published"].includes(data.status)) throw Error("Trạng thái sự kiện không hợp lệ: " + id);
      }
      if (eventCaptions && (
        typeof data.text !== "string" || !data.text.trim()
        || !Number.isInteger(data.order) || data.order < 0
        || !["approved", "draft"].includes(data.status)
      )) throw Error("Caption sự kiện cần text, order và status hợp lệ: " + id);
      const segments = (path + "/" + id).split("/");
      if (segments.length % 2 !== 0) throw Error("Đường dẫn document không hợp lệ.");
      entries.push({ path: path + "/" + id, data });
    }
  }
  if (!entries.length || entries.length > MAX_DOCS) throw Error("Số document không hợp lệ.");
  if (new Set(entries.map(x => x.path)).size !== entries.length)
    throw Error("Có document ID trùng.");
  return { entries, counts };
}

function updateButton() {
  $("import").disabled = busy || publishing || !currentUser || !parsed ||
    $("confirm-project").value.trim() !== PROJECT_ID || !$("ack").checked;
  $("publish-button").disabled = busy || publishing || !currentUser;
}

$("publish-event").onsubmit = async event => {
  event.preventDefault();
  if (!currentUser || !db || busy || publishing) return;
  const id = $("publish-id").value.trim();
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return;
  publishing = true;
  updateButton();
  try {
    await updateDoc(doc(db, "events", id), { status: "published" });
    $("publish-result").textContent = "Đã xuất bản sự kiện " + id + ".";
  } catch (error) {
    $("publish-result").textContent = "Không xuất bản được: " + (error.code || error.message);
  } finally {
    publishing = false;
    updateButton();
  }
};

$("login").onclick = async () => {
  try { await signInWithGoogle(); }
  catch (e) { log("Đăng nhập thất bại: " + (e.code || e.message)); }
};
$("logout").onclick = async () => {
  try { await signOutUser(); } catch(e) { log("Đăng xuất thất bại: " + e.message); }
};
$("confirm-project").addEventListener("input", updateButton);
$("ack").addEventListener("change", updateButton);

if (!isFirebaseConfigured) {
  $("auth-state").textContent = "Firebase chưa cấu hình.";
} else {
  $("login").disabled = false;
  observeAuth(user => {
    currentUser = user;
    $("auth-state").textContent = user
      ? "Đã đăng nhập: " + (user.email || user.displayName || "Google user")
      : "Chưa đăng nhập.";
    $("auth-uid").textContent = user ? "UID (dùng trong Firestore Rules): " + user.uid : "";
    $("login").disabled = !!user;
    $("logout").disabled = !user;
    updateButton();
  });
}

$("file").addEventListener("change", async event => {
  parsed = null;
  $("preview").replaceChildren();
  try {
    const file = event.target.files?.[0];
    if (!file) { message("Chưa chọn file."); return; }
    if (file.size > MAX_BYTES) throw Error("File vượt giới hạn 2 MB.");
    parsed = validateSeed(JSON.parse(await file.text()));
    message("Đã kiểm tra " + parsed.entries.length + " document. Đây chỉ là bản xem trước.");
    const table = document.createElement("table");
    const header = document.createElement("tr");
    for (const title of ["Đường dẫn collection", "Document"]) {
      const th = document.createElement("th"); th.textContent = title; header.append(th);
    }
    table.append(header);
    for (const [path, count] of Object.entries(parsed.counts)) {
      const tr = document.createElement("tr");
      for (const text of [path, String(count)]) {
        const td = document.createElement("td"); td.textContent = text; tr.append(td);
      }
      table.append(tr);
    }
    $("preview").append(table);
  } catch(e) {
    parsed = null;
    message("Không đọc được JSON: " + e.message);
  } finally { updateButton(); }
});

$("import").onclick = async () => {
  updateButton();
  if ($("import").disabled || !currentUser || !db) return;
  const { entries } = parsed;
  busy = true; updateButton();
  let created = 0, skipped = 0, scanned = 0;
  try {
    log("Đang kiểm tra document đã tồn tại…");
    // Explicitly check existing documents before writing. Existing documents are never overwritten.
    const missing = [];
    for (const item of entries) {
      const snap = await getDoc(doc(db, item.path));
      scanned++;
      if (snap.exists()) skipped++; else missing.push(item);
      if (scanned % 30 === 0) log("Đã kiểm tra " + scanned + "/" + entries.length);
    }
    // Every batch is below Firestore's 500-operation limit.
    for (let offset = 0; offset < missing.length; offset += 150) {
      const slice = missing.slice(offset, offset + 150);
      const batch = writeBatch(db);
      for (const item of slice) batch.set(doc(db, item.path), item.data);
      await batch.commit();
      created += slice.length;
      log("Đã tạo " + created + "/" + missing.length + "; bỏ qua " + skipped + " document có sẵn.");
    }
    log("Hoàn tất: đã tạo " + created + ", bỏ qua " + skipped + " document đã tồn tại.");
  } catch(e) {
    console.error("Firestore import failed", e);
    log("Import dừng. Đã tạo " + created + " document. Lỗi: " +
      (e.code || e.message) + ". Nếu là permission-denied, kiểm tra Admin UID và Security Rules.");
  } finally { busy = false; updateButton(); }
};
