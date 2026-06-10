// HI-NOVA APEX Admin Panel - Professional Blogger-like CMS
// All client-side, no build step. Uses Firebase Auth, Firestore, and Storage.
//
// ─── FIREBASE STORAGE RULES (add to Firebase Console → Storage → Rules) ───
// rules_version = '2';
// service firebase.storage {
//   match /b/{bucket}/o {
//     match /blog/{allPaths=**} {
//       allow read: if true;
//       allow write: if request.auth != null
//           && request.resource.size < 5 * 1024 * 1024
//           && request.resource.contentType.matches('image/.*');
//     }
//   }
// }
// ──────────────────────────────────────────────────────────────────────────

import { auth, db, storage } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
function fmtDate(v) {
  if (!v) return "";
  let d;
  if (v && typeof v.toDate === "function") d = v.toDate();
  else d = new Date(v);
  if (isNaN(d.getTime())) return esc(String(v));
  return d.toLocaleString();
}
function fmtDateShort(v) {
  if (!v) return "";
  let d;
  if (v && typeof v.toDate === "function") d = v.toDate();
  else d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function tsVal(v) {
  if (v && typeof v.toMillis === "function") return v.toMillis();
  const d = new Date(v);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}
function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-email": return "Invalid email address.";
    case "auth/user-disabled": return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Incorrect email or password.";
    case "auth/too-many-requests": return "Too many attempts. Try again later.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    default: return "Sign in failed. Please try again.";
  }
}
function safeImg(url) {
  if (!url) return "";
  if (/^https?:|^\/|^(data:)/i.test(url)) return url;
  return "";
}
function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvEscape(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// ─────────────────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────────────────
const state = {
  posts: [],
  contacts: [],
  newsletter: [],
  categories: [],
  currentPage: "dashboard",
  editor: {
    quill: null,
    editingId: null,
    coverImage: "",
    tags: []
  },
  postsPage: { search: "", category: "all", status: "all", page: 1 },
  messagesFilter: "all",
  newsletterSearch: ""
};

// ─────────────────────────────────────────────────────────────────────────
// ELEMENT REFS
// ─────────────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const els = {
  loginView: $("login-view"),
  appView: $("app-view"),
  loginForm: $("login-form"),
  loginError: $("login-error"),
  logoutBtn: $("logout-btn"),
  userEmail: $("user-email"),
  userName: $("user-name"),
  userAvatar: $("user-avatar"),
  pageTitle: $("page-title"),
  adminContent: $("admin-content"),
  toastContainer: $("toast-container"),
  modalContainer: $("modal-container"),
  menuToggle: $("menu-toggle"),
  sidebar: $("admin-sidebar"),
  sidebarOverlay: $("sidebar-overlay"),
  postsCountBadge: $("posts-count"),
  messagesCountBadge: $("messages-count")
};

// ─────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────
function toast(message, type = "info", duration = 4000) {
  if (!els.toastContainer) return;
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };
  const el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.innerHTML = '<div class="toast-icon">' + (icons[type] || icons.info) + '</div>' +
    '<div class="toast-message">' + esc(message) + '</div>' +
    '<button class="toast-close" aria-label="Close">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
    '</button>';
  els.toastContainer.appendChild(el);
  // animate in
  requestAnimationFrame(() => el.classList.add("toast-show"));
  const remove = () => {
    el.classList.remove("toast-show");
    el.classList.add("toast-hide");
    setTimeout(() => el.remove(), 300);
  };
  el.querySelector(".toast-close").addEventListener("click", remove);
  if (duration > 0) setTimeout(remove, duration);
}

// ─────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────
function closeModal() {
  if (!els.modalContainer) return;
  els.modalContainer.innerHTML = "";
  els.modalContainer.classList.remove("modal-open");
  document.body.style.overflow = "";
}
function showModal(html) {
  if (!els.modalContainer) return;
  els.modalContainer.innerHTML = html;
  els.modalContainer.classList.add("modal-open");
  document.body.style.overflow = "hidden";
  // close on backdrop click
  const backdrop = els.modalContainer.querySelector(".modal-backdrop");
  if (backdrop) backdrop.addEventListener("click", closeModal);
  // close on X
  const x = els.modalContainer.querySelector("[data-modal-close]");
  if (x) x.addEventListener("click", closeModal);
}
function confirmModal({ title, message, confirmText = "Confirm", cancelText = "Cancel", danger = false } = {}) {
  return new Promise((resolve) => {
    showModal(
      '<div class="modal-backdrop"></div>' +
      '<div class="modal-dialog modal-dialog-sm">' +
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<h3 class="modal-title">' + esc(title || "Are you sure?") + '</h3>' +
            '<button class="modal-close" data-modal-close aria-label="Close">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>' +
          '</div>' +
          '<div class="modal-body">' + (message ? '<p>' + esc(message) + '</p>' : "") + '</div>' +
          '<div class="modal-footer">' +
            '<button class="btn btn-secondary" data-modal-close>' + esc(cancelText) + '</button>' +
            '<button class="btn ' + (danger ? "btn-danger" : "btn-primary") + '" data-modal-confirm>' + esc(confirmText) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    const confirmBtn = els.modalContainer.querySelector("[data-modal-confirm]");
    const onClose = () => { closeModal(); };
    els.modalContainer.addEventListener("click", function once(e) {
      if (e.target.matches("[data-modal-close]") || e.target.closest("[data-modal-close]")) {
        els.modalContainer.removeEventListener("click", once);
        onClose();
        resolve(false);
      } else if (e.target === confirmBtn) {
        els.modalContainer.removeEventListener("click", once);
        onClose();
        resolve(true);
      }
    }, true);
  });
}

// ─────────────────────────────────────────────────────────────────────────
// IMAGE UPLOAD (Firebase Storage)
// ─────────────────────────────────────────────────────────────────────────
function resizeImage(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) { resolve(file); return; }
    const img = new Image();
    img.onload = function () {
      if (img.width <= maxWidth) { resolve(file); return; }
      const ratio = maxWidth / img.width;
      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) {
        if (!blob) { resolve(file); return; }
        // Preserve filename, change extension based on output type
        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        resolve(new File([blob], name, { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };
    img.onerror = function () { resolve(file); };
    img.src = URL.createObjectURL(file);
  });
}
function uploadImage(file, pathPrefix, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));
    if (!file.type.startsWith("image/")) return reject(new Error("Not an image"));
    if (file.size > 5 * 1024 * 1024) return reject(new Error("File too large (max 5MB)"));

    resizeImage(file).then(function (f) {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = pathPrefix + "/" + Date.now() + "_" + safeName;
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, f, { contentType: f.type });
      task.on("state_changed",
        function (snap) {
          if (onProgress) {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            onProgress(pct);
          }
        },
        function (err) { reject(err); },
        function () { getDownloadURL(task.snapshot.ref).then(resolve).catch(reject); }
      );
    }).catch(reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────
if (els.loginForm) {
  els.loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (els.loginError) { els.loginError.style.display = "none"; els.loginError.textContent = ""; }
    const email = $("login-email").value.trim();
    const password = $("login-password").value;
    const btn = els.loginForm.querySelector("button[type=submit]");
    if (btn) { btn.disabled = true; btn.textContent = "Signing in..."; }
    signInWithEmailAndPassword(auth, email, password)
      .catch(function (err) {
        if (els.loginError) {
          els.loginError.textContent = mapAuthError(err.code);
          els.loginError.style.display = "block";
        }
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = "Sign In"; }
      });
  });
}
if (els.logoutBtn) {
  els.logoutBtn.addEventListener("click", function () { signOut(auth); });
}

onAuthStateChanged(auth, function (user) {
  if (user) {
    if (els.loginView) els.loginView.style.display = "none";
    if (els.appView) els.appView.style.display = "flex";
    if (els.userEmail) els.userEmail.textContent = user.email || "";
    if (els.userName) els.userName.textContent = (user.email || "A").split("@")[0] || "Admin";
    if (els.userAvatar) els.userAvatar.textContent = ((user.email || "A")[0] || "A").toUpperCase();
    loadAllData().then(function () {
      navigateTo("dashboard");
    });
  } else {
    if (els.loginView) els.loginView.style.display = "flex";
    if (els.appView) els.appView.style.display = "none";
  }
});

// ─────────────────────────────────────────────────────────────────────────
// DATA LOADING
// ─────────────────────────────────────────────────────────────────────────
async function loadAllData() {
  try {
    await Promise.all([loadPosts(), loadContacts(), loadNewsletter()]);
    updateSidebarBadges();
  } catch (e) {
    console.error(e);
    toast("Failed to load data: " + e.message, "error");
  }
}
async function loadPosts() {
  const snap = await getDocs(collection(db, "blog_posts"));
  const rows = [];
  snap.forEach(function (d) { rows.push(Object.assign({ _id: d.id }, d.data())); });
  rows.sort(function (a, b) { return tsVal(b.date_published) - tsVal(a.date_published); });
  state.posts = rows;
  // Derive categories from posts
  const set = new Set();
  rows.forEach(function (p) { if (p.category) set.add(String(p.category).trim()); });
  state.categories = Array.from(set).sort(function (a, b) { return a.localeCompare(b); });
  return rows;
}
async function loadContacts() {
  const snap = await getDocs(collection(db, "contacts"));
  const rows = [];
  snap.forEach(function (d) { rows.push(Object.assign({ _id: d.id }, d.data())); });
  rows.sort(function (a, b) { return tsVal(b.created_at || b.createdAt) - tsVal(a.created_at || a.createdAt); });
  state.contacts = rows;
  return rows;
}
async function loadNewsletter() {
  // Try both collection names used by the project
  const [a, b] = await Promise.all([
    safeGetAll("newsletter_subscribers"),
    safeGetAll("newsletter")
  ]);
  const seen = {};
  const rows = [];
  [].concat(a, b).forEach(function (r) {
    const key = (r.email || "").toLowerCase();
    if (key && !seen[key]) { seen[key] = true; rows.push(r); }
  });
  rows.sort(function (x, y) { return tsVal(y.created_at || y.createdAt) - tsVal(x.created_at || x.createdAt); });
  state.newsletter = rows;
  return rows;
}
function safeGetAll(name) {
  return getDocs(collection(db, name))
    .then(function (snap) {
      const rows = [];
      snap.forEach(function (d) { rows.push(Object.assign({ _id: d.id }, d.data())); });
      return rows;
    })
    .catch(function () { return []; });
}

function updateSidebarBadges() {
  if (els.postsCountBadge) {
    const total = state.posts.length;
    if (total > 0) {
      els.postsCountBadge.textContent = total;
      els.postsCountBadge.style.display = "";
    } else {
      els.postsCountBadge.style.display = "none";
    }
  }
  if (els.messagesCountBadge) {
    const unread = state.contacts.filter(function (c) { return !c.is_read; }).length;
    if (unread > 0) {
      els.messagesCountBadge.textContent = unread;
      els.messagesCountBadge.style.display = "";
    } else {
      els.messagesCountBadge.style.display = "none";
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────
const PAGES = {
  dashboard: { title: "Dashboard", render: renderDashboard },
  posts: { title: "Manage Posts", render: renderPosts },
  "create-post": { title: "New Post", render: renderEditor },
  categories: { title: "Categories", render: renderCategories },
  messages: { title: "Messages", render: renderMessages },
  newsletter: { title: "Newsletter", render: renderNewsletter }
};

// ─── Phase E bridge: expose PAGES + navigateTo on window so admin-cms.js
// can register additional pages and trigger navigation. ────────────────
window.PAGES = PAGES;
window.navigateTo = navigateTo;

function navigateTo(page, opts) {
  if (!PAGES[page]) page = "dashboard";
  state.currentPage = page;
  // Update sidebar
  document.querySelectorAll(".nav-item[data-page]").forEach(function (n) {
    n.classList.toggle("active", n.dataset.page === page);
  });
  // Update topbar title
  if (els.pageTitle) els.pageTitle.textContent = PAGES[page].title;
  // Close mobile sidebar
  if (els.sidebar) els.sidebar.classList.remove("open");
  if (els.sidebarOverlay) els.sidebarOverlay.classList.remove("open");

  // Special: editor may need to know the editing id
  if (page === "create-post" && opts && opts.editId) {
    state.editor.editingId = opts.editId;
  } else if (page === "create-post") {
    state.editor.editingId = null;
  }

  // Render
  PAGES[page].render();

  // Scroll to top of content
  if (els.adminContent) els.adminContent.scrollTop = 0;
}

document.addEventListener("click", function (e) {
  const nav = e.target.closest("[data-page]");
  if (nav) {
    e.preventDefault();
    navigateTo(nav.dataset.page);
  }
});

// Mobile sidebar
if (els.menuToggle) {
  els.menuToggle.addEventListener("click", function () {
    if (els.sidebar) els.sidebar.classList.toggle("open");
    if (els.sidebarOverlay) els.sidebarOverlay.classList.toggle("open");
  });
}
if (els.sidebarOverlay) {
  els.sidebarOverlay.addEventListener("click", function () {
    if (els.sidebar) els.sidebar.classList.remove("open");
    if (els.sidebarOverlay) els.sidebarOverlay.classList.remove("open");
  });
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────
function renderDashboard() {
  const total = state.posts.length;
  const published = state.posts.filter(function (p) { return (p.status || "published") === "published"; }).length;
  const drafts = state.posts.filter(function (p) { return p.status === "draft"; }).length;
  const unread = state.contacts.filter(function (c) { return !c.is_read; }).length;
  const recentPosts = state.posts.slice(0, 5);
  const recentContacts = state.contacts.slice(0, 5);

  els.adminContent.innerHTML =
    '<div class="page-header">' +
      '<div>' +
        '<h2 class="page-heading">Welcome back!</h2>' +
        '<p class="page-subheading">Here\'s what\'s happening with your blog.</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-primary" data-navigate="create-post">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
          'New Post' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="stats-grid">' +
      statCard("Total Posts", total, "file-text", "brand") +
      statCard("Published", published, "check-circle", "success") +
      statCard("Drafts", drafts, "edit", "warning") +
      statCard("Unread Messages", unread, "mail", "info") +
    '</div>' +

    '<div class="dashboard-grid">' +
      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title">Recent Posts</h3>' +
          '<button class="btn btn-ghost btn-sm" data-navigate="posts">View all →</button>' +
        '</div>' +
        '<div class="card-body">' +
          (recentPosts.length === 0
            ? emptyState("No posts yet", "Create your first post to get started.")
            : recentPosts.map(function (p) { return recentPostItem(p); }).join("")) +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title">Recent Messages</h3>' +
          '<button class="btn btn-ghost btn-sm" data-navigate="messages">View all →</button>' +
        '</div>' +
        '<div class="card-body">' +
          (recentContacts.length === 0
            ? emptyState("No messages yet", "Contact form submissions will appear here.")
            : recentContacts.map(function (c) { return recentMessageItem(c); }).join("")) +
        '</div>' +
      '</div>' +
    '</div>';
}

function statCard(label, value, icon, color) {
  const icons = {
    "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>',
    "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
    "edit": '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
    "mail": '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>'
  };
  return '<div class="stat-card stat-' + esc(color) + '">' +
    '<div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (icons[icon] || icons["file-text"]) + '</svg></div>' +
    '<div class="stat-content">' +
      '<div class="stat-value">' + esc(String(value)) + '</div>' +
      '<div class="stat-label">' + esc(label) + '</div>' +
    '</div>' +
  '</div>';
}

function recentPostItem(p) {
  const status = p.status || "published";
  return '<a class="recent-item" data-edit-post="' + esc(p._id) + '" href="#">' +
    '<div class="recent-item-main">' +
      '<div class="recent-item-title">' + esc(p.title || "Untitled") + '</div>' +
      '<div class="recent-item-meta">' + esc(p.category || "Uncategorized") + ' · ' + esc(fmtDateShort(p.date_published)) + '</div>' +
    '</div>' +
    '<span class="status-pill status-' + esc(status) + '">' + esc(status) + '</span>' +
  '</a>';
}

function recentMessageItem(c) {
  return '<div class="recent-item' + (c.is_read ? "" : " unread") + '">' +
    '<div class="recent-item-main">' +
      '<div class="recent-item-title">' + esc(c.name || "(no name)") + '</div>' +
      '<div class="recent-item-meta">' + esc(c.email || "") + ' · ' + esc(fmtDateShort(c.created_at || c.createdAt)) + '</div>' +
    '</div>' +
    (c.is_read ? "" : '<span class="status-pill status-warning">New</span>') +
  '</div>';
}

function emptyState(title, message) {
  return '<div class="empty-state">' +
    '<div class="empty-state-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>' +
    '</div>' +
    '<div class="empty-state-title">' + esc(title) + '</div>' +
    '<div class="empty-state-message">' + esc(message) + '</div>' +
  '</div>';
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE: MANAGE POSTS
// ─────────────────────────────────────────────────────────────────────────
function renderPosts() {
  const filters = state.postsPage;
  const filtered = state.posts.filter(function (p) {
    if (filters.search && !((p.title || "").toLowerCase().includes(filters.search.toLowerCase()))) return false;
    if (filters.category !== "all" && p.category !== filters.category) return false;
    if (filters.status !== "all" && (p.status || "published") !== filters.status) return false;
    return true;
  });
  const perPage = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  if (filters.page > totalPages) filters.page = totalPages;
  const start = (filters.page - 1) * perPage;
  const pageRows = filtered.slice(start, start + perPage);

  els.adminContent.innerHTML =
    '<div class="page-header">' +
      '<div>' +
        '<h2 class="page-heading">Posts</h2>' +
        '<p class="page-subheading">' + esc(filtered.length) + ' of ' + esc(state.posts.length) + ' posts</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-primary" data-navigate="create-post">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
          'New Post' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="posts-toolbar">' +
      '<div class="search-box">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
        '<input type="search" id="posts-search" class="form-input" placeholder="Search posts by title..." value="' + esc(filters.search) + '">' +
      '</div>' +
      '<select id="posts-category" class="form-input filter-select">' +
        '<option value="all"' + (filters.category === "all" ? " selected" : "") + '>All categories</option>' +
        state.categories.map(function (c) { return '<option value="' + esc(c) + '"' + (filters.category === c ? " selected" : "") + '>' + esc(c) + '</option>'; }).join("") +
      '</select>' +
      '<select id="posts-status" class="form-input filter-select">' +
        '<option value="all"' + (filters.status === "all" ? " selected" : "") + '>All status</option>' +
        '<option value="published"' + (filters.status === "published" ? " selected" : "") + '>Published</option>' +
        '<option value="draft"' + (filters.status === "draft" ? " selected" : "") + '>Draft</option>' +
      '</select>' +
    '</div>' +

    '<div class="posts-list">' +
      (pageRows.length === 0
        ? emptyState("No posts match", "Try adjusting your filters or search query.")
        : pageRows.map(function (p) { return postCard(p); }).join("")) +
    '</div>' +

    (totalPages > 1 ? pagination(filters.page, totalPages) : "");
}

function postCard(p) {
  const status = p.status || "published";
  const cover = safeImg(p.cover_image);
  const tags = Array.isArray(p.tags) ? p.tags : [];
  return '<div class="post-card">' +
    '<div class="post-card-image">' +
      (cover
        ? '<img src="' + esc(cover) + '" alt="' + esc(p.title || "") + '">'
        : '<div class="post-card-image-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>') +
    '</div>' +
    '<div class="post-card-content">' +
      '<div class="post-card-header">' +
        '<h3 class="post-card-title">' + esc(p.title || "Untitled") + '</h3>' +
        '<span class="post-card-status ' + esc(status) + '">' + esc(status) + '</span>' +
      '</div>' +
      '<div class="post-card-meta">' +
        (p.category ? '<span class="post-card-category">' + esc(p.category) + '</span>' : "") +
        '<span>' + esc(fmtDateShort(p.date_published)) + '</span>' +
        (p.author_name ? '<span>By ' + esc(p.author_name) + '</span>' : "") +
      '</div>' +
      (tags.length
        ? '<div class="post-card-tags">' + tags.slice(0, 5).map(function (t) { return '<span class="post-card-tag">' + esc(t) + '</span>'; }).join("") + '</div>'
        : "") +
      '<div class="post-card-actions">' +
        '<button class="btn btn-secondary btn-sm" data-edit-post="' + esc(p._id) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
          'Edit' +
        '</button>' +
        '<a class="btn btn-secondary btn-sm" href="post-view.html?slug=' + encodeURIComponent(p.slug || "") + '" target="_blank" rel="noopener">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
          'View' +
        '</a>' +
        '<button class="btn btn-secondary btn-sm btn-danger-outline" data-delete-post="' + esc(p._id) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
          'Delete' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function pagination(current, total) {
  return '<div class="pagination">' +
    '<button class="btn btn-secondary btn-sm" data-page-prev ' + (current === 1 ? "disabled" : "") + '>← Previous</button>' +
    '<span class="pagination-info">Page ' + esc(current) + ' of ' + esc(total) + '</span>' +
    '<button class="btn btn-secondary btn-sm" data-page-next ' + (current === total ? "disabled" : "") + '>Next →</button>' +
  '</div>';
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE: EDITOR
// ─────────────────────────────────────────────────────────────────────────
function renderEditor() {
  const isEdit = !!state.editor.editingId;
  const post = isEdit ? state.posts.find(function (p) { return p._id === state.editor.editingId; }) : null;

  els.adminContent.innerHTML =
    '<div class="page-header">' +
      '<div>' +
        '<h2 class="page-heading">' + esc(isEdit ? "Edit Post" : "Create New Post") + '</h2>' +
        '<p class="page-subheading">' + esc(isEdit ? "Update your post content and settings" : "Write and publish a new blog post") + '</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-secondary" data-preview-post>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
          'Preview' +
        '</button>' +
        (isEdit ? '<button class="btn btn-secondary" data-navigate="posts">Cancel</button>' : "") +
      '</div>' +
    '</div>' +

    '<form id="editor-form" class="editor-layout">' +
      '<div class="editor-main">' +
        '<div class="form-group">' +
          '<label class="form-label" for="ed-title">Title</label>' +
          '<input type="text" id="ed-title" class="form-input form-input-lg" required value="' + esc(post && post.title || "") + '" placeholder="An engaging title...">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="ed-slug">Slug</label>' +
          '<input type="text" id="ed-slug" class="form-input" value="' + esc(post && post.slug || "") + '" placeholder="auto-generated-from-title">' +
          '<div class="form-hint">Used in the post URL. Leave blank to auto-generate.</div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label">Cover Image</label>' +
          '<div id="cover-drop" class="cover-drop" tabindex="0">' +
            '<input type="file" id="cover-file" accept="image/*" hidden>' +
            '<div id="cover-preview" class="cover-preview" style="display:none">' +
              '<img id="cover-img" alt="Cover preview">' +
              '<button type="button" class="cover-remove" id="cover-remove" aria-label="Remove cover">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
              '</button>' +
              '<div class="cover-progress" id="cover-progress" style="display:none">' +
                '<div class="cover-progress-bar" id="cover-progress-bar"></div>' +
              '</div>' +
            '</div>' +
            '<div id="cover-placeholder" class="cover-placeholder">' +
              '<svg class="cover-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' +
              '<div class="cover-placeholder-text">Drag & drop an image, or click to browse</div>' +
              '<div class="cover-placeholder-hint">PNG, JPG, WebP up to 5MB</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label">Content</label>' +
          '<div class="editor-container">' +
            '<div id="quill-toolbar">' +
              '<span class="ql-formats">' +
                '<select class="ql-header"></select>' +
              '</span>' +
              '<span class="ql-formats">' +
                '<button class="ql-bold"></button>' +
                '<button class="ql-italic"></button>' +
                '<button class="ql-underline"></button>' +
                '<button class="ql-strike"></button>' +
              '</span>' +
              '<span class="ql-formats">' +
                '<button class="ql-list" value="ordered"></button>' +
                '<button class="ql-list" value="bullet"></button>' +
                '<button class="ql-blockquote"></button>' +
                '<button class="ql-code-block"></button>' +
              '</span>' +
              '<span class="ql-formats">' +
                '<button class="ql-link"></button>' +
                '<button class="ql-image"></button>' +
              '</span>' +
              '<span class="ql-formats">' +
                '<button class="ql-clean"></button>' +
              '</span>' +
            '</div>' +
            '<div id="quill-editor"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="editor-side">' +
        '<div class="card">' +
          '<div class="card-header"><h3 class="card-title">Publish</h3></div>' +
          '<div class="card-body">' +
            '<div class="form-group">' +
              '<label class="form-label" for="ed-status">Status</label>' +
              '<select id="ed-status" class="form-input">' +
                '<option value="draft"' + ((post && post.status === "draft") ? " selected" : "") + '>Draft</option>' +
                '<option value="published"' + ((!post || (post.status || "published") === "published") ? " selected" : "") + '>Published</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="ed-category">Category</label>' +
              '<input type="text" id="ed-category" list="ed-category-list" class="form-input" value="' + esc(post && post.category || "") + '" placeholder="e.g. Manufacture" required>' +
              '<datalist id="ed-category-list">' +
                state.categories.map(function (c) { return '<option value="' + esc(c) + '"></option>'; }).join("") +
              '</datalist>' +
            '</div>' +
            '<div class="form-actions">' +
              '<button type="button" class="btn btn-secondary" data-save-draft>' + esc(isEdit ? "Save Changes" : "Save Draft") + '</button>' +
              '<button type="button" class="btn btn-primary" data-save-publish>' + esc(isEdit && (post.status === "published") ? "Update" : "Publish") + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-header"><h3 class="card-title">Tags</h3></div>' +
          '<div class="card-body">' +
            '<div class="form-group">' +
              '<input type="text" id="ed-tags-input" class="form-input" placeholder="Type a tag and press Enter">' +
              '<div class="form-hint">Press Enter or comma to add</div>' +
            '</div>' +
            '<div id="ed-tags-list" class="tags-list"></div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-header"><h3 class="card-title">Details</h3></div>' +
          '<div class="card-body">' +
            '<div class="form-group">' +
              '<label class="form-label" for="ed-description">Short Description</label>' +
              '<input type="text" id="ed-description" class="form-input" value="' + esc(post && post.description || "") + '" placeholder="A one-line summary shown in listings">' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="ed-author">Author Name</label>' +
              '<input type="text" id="ed-author" class="form-input" value="' + esc(post && post.author_name || "") + '" placeholder="Admin">' +
            '</div>' +
            '<details class="advanced">' +
              '<summary>Advanced author fields</summary>' +
              '<div class="form-group">' +
                '<label class="form-label" for="ed-author-email">Author Email</label>' +
                '<input type="email" id="ed-author-email" class="form-input" value="' + esc(post && post.author_email || "") + '" placeholder="admin@hinova.com">' +
              '</div>' +
              '<div class="form-group">' +
                '<label class="form-label" for="ed-author-image">Author Image URL</label>' +
                '<input type="text" id="ed-author-image" class="form-input" value="' + esc(post && post.author_image || "") + '" placeholder="https://...">' +
              '</div>' +
              '<div class="form-group">' +
                '<label class="form-label" for="ed-author-desc">Author Bio</label>' +
                '<textarea id="ed-author-desc" class="form-input" rows="3" placeholder="Short bio shown in the post\'s author box">' + esc(post && post.author_description || "") + '</textarea>' +
              '</div>' +
            '</details>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</form>';

  // Initialize Quill
  state.editor.quill = new Quill("#quill-editor", {
    theme: "snow",
    modules: {
      toolbar: "#quill-toolbar"
    }
  });
  // Set initial content
  if (post && post.content_html) {
    state.editor.quill.clipboard.dangerouslyPasteHTML(post.content_html);
  }

  // Custom image handler
  state.editor.quill.getModule("toolbar").addHandler("image", openImageDialog);

  // Cover image setup
  setupCoverUpload(post && post.cover_image || "");

  // Tags setup
  state.editor.tags = Array.isArray(post && post.tags) ? post.tags.slice() : [];
  renderTagsInput();

  // Slug auto-fill
  const titleInput = $("ed-title");
  const slugInput = $("ed-slug");
  titleInput.addEventListener("blur", function () {
    if (!slugInput.value.trim() && titleInput.value.trim()) {
      slugInput.value = slugify(titleInput.value);
    }
  });

  // Tags input
  const tagsInput = $("ed-tags-input");
  tagsInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const v = tagsInput.value.trim().replace(/,$/, "");
      if (v && state.editor.tags.indexOf(v) === -1) {
        state.editor.tags.push(v);
        renderTagsInput();
      }
      tagsInput.value = "";
    } else if (e.key === "Backspace" && !tagsInput.value && state.editor.tags.length) {
      state.editor.tags.pop();
      renderTagsInput();
    }
  });

  // Save buttons
  $("editor-form").addEventListener("submit", function (e) { e.preventDefault(); });
  document.querySelector("[data-save-draft]").addEventListener("click", function () { savePost("draft"); });
  document.querySelector("[data-save-publish]").addEventListener("click", function () { savePost("published"); });

  // Preview
  document.querySelector("[data-preview-post]").addEventListener("click", previewPost);

  // Ctrl+S
  const onKey = function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      savePost($("ed-status").value);
    }
  };
  document.addEventListener("keydown", onKey);
  // Remove listener when leaving the editor
  const observer = new MutationObserver(function () {
    if (state.currentPage !== "create-post") {
      document.removeEventListener("keydown", onKey);
      observer.disconnect();
    }
  });
  observer.observe(els.adminContent, { childList: true });
}

function setupCoverUpload(initial) {
  const drop = $("cover-drop");
  const fileInput = $("cover-file");
  const preview = $("cover-preview");
  const placeholder = $("cover-placeholder");
  const img = $("cover-img");
  const removeBtn = $("cover-remove");
  const progress = $("cover-progress");
  const progressBar = $("cover-progress-bar");

  function showPreview(url) {
    state.editor.coverImage = url;
    img.src = url;
    preview.style.display = "block";
    placeholder.style.display = "none";
  }
  function showPlaceholder() {
    state.editor.coverImage = "";
    img.src = "";
    preview.style.display = "none";
    placeholder.style.display = "flex";
  }
  if (initial) showPreview(initial);

  drop.addEventListener("click", function (e) {
    if (e.target.closest("#cover-remove")) return;
    fileInput.click();
  });
  drop.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("drag-over"); });
  drop.addEventListener("dragleave", function () { drop.classList.remove("drag-over"); });
  drop.addEventListener("drop", function (e) {
    e.preventDefault();
    drop.classList.remove("drag-over");
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) doUpload(f);
  });
  fileInput.addEventListener("change", function () {
    const f = fileInput.files && fileInput.files[0];
    if (f) doUpload(f);
    fileInput.value = "";
  });
  removeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    showPlaceholder();
  });

  function doUpload(file) {
    progress.style.display = "block";
    progressBar.style.width = "0%";
    uploadImage(file, "blog/covers", function (pct) {
      progressBar.style.width = pct + "%";
    }).then(function (url) {
      showPreview(url);
      progress.style.display = "none";
      toast("Cover image uploaded", "success");
    }).catch(function (err) {
      progress.style.display = "none";
      toast("Upload failed: " + (err.message || err), "error");
    });
  }
}

function renderTagsInput() {
  const list = $("ed-tags-list");
  if (!list) return;
  if (!state.editor.tags.length) {
    list.innerHTML = '<div class="tags-empty">No tags yet</div>';
    return;
  }
  list.innerHTML = state.editor.tags.map(function (t, i) {
    return '<span class="tag-pill">' + esc(t) + '<button type="button" class="tag-remove" data-tag-index="' + i + '" aria-label="Remove tag">×</button></span>';
  }).join("");
  list.querySelectorAll(".tag-remove").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const idx = parseInt(btn.dataset.tagIndex, 10);
      state.editor.tags.splice(idx, 1);
      renderTagsInput();
    });
  });
}

function openImageDialog() {
  const quill = state.editor.quill;
  showModal(
    '<div class="modal-backdrop"></div>' +
    '<div class="modal-dialog">' +
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h3 class="modal-title">Insert Image</h3>' +
          '<button class="modal-close" data-modal-close aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="tabs">' +
            '<button class="tab tab-active" data-tab="upload">Upload</button>' +
            '<button class="tab" data-tab="url">From URL</button>' +
          '</div>' +
          '<div class="tab-panel tab-panel-active" data-tab-panel="upload">' +
            '<div id="img-drop" class="image-drop">' +
              '<input type="file" id="img-file" accept="image/*" hidden>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>' +
              '<div>Drag & drop, or click to browse</div>' +
              '<div class="form-hint">PNG, JPG, WebP up to 5MB</div>' +
            '</div>' +
            '<div id="img-progress" class="upload-progress" style="display:none">' +
              '<div class="upload-progress-bar" id="img-progress-bar"></div>' +
              '<div class="upload-progress-text" id="img-progress-text">Uploading... 0%</div>' +
            '</div>' +
          '</div>' +
          '<div class="tab-panel" data-tab-panel="url">' +
            '<div class="form-group">' +
              '<label class="form-label" for="img-url">Image URL</label>' +
              '<input type="url" id="img-url" class="form-input" placeholder="https://...">' +
            '</div>' +
            '<div class="form-actions">' +
              '<button class="btn btn-primary" id="img-url-insert">Insert</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );

  // Tabs
  document.querySelectorAll(".modal-container .tab, [data-tab]").forEach(function (t) {
    if (!t.dataset.tab) return;
    t.addEventListener("click", function () {
      const tab = t.dataset.tab;
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("tab-active", x.dataset.tab === tab); });
      document.querySelectorAll(".tab-panel").forEach(function (x) { x.classList.toggle("tab-panel-active", x.dataset.tabPanel === tab); });
    });
  });

  // Upload tab
  const imgDrop = $("img-drop");
  const imgFile = $("img-file");
  imgDrop.addEventListener("click", function () { imgFile.click(); });
  imgDrop.addEventListener("dragover", function (e) { e.preventDefault(); imgDrop.classList.add("drag-over"); });
  imgDrop.addEventListener("dragleave", function () { imgDrop.classList.remove("drag-over"); });
  imgDrop.addEventListener("drop", function (e) {
    e.preventDefault();
    imgDrop.classList.remove("drag-over");
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) doContentUpload(f);
  });
  imgFile.addEventListener("change", function () {
    const f = imgFile.files && imgFile.files[0];
    if (f) doContentUpload(f);
    imgFile.value = "";
  });

  function doContentUpload(file) {
    const progress = $("img-progress");
    const bar = $("img-progress-bar");
    const text = $("img-progress-text");
    progress.style.display = "block";
    bar.style.width = "0%";
    text.textContent = "Uploading... 0%";
    uploadImage(file, "blog/content", function (pct) {
      bar.style.width = pct + "%";
      text.textContent = "Uploading... " + pct + "%";
    }).then(function (url) {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, "image", url, "user");
      quill.setSelection(range.index + 1);
      closeModal();
      toast("Image inserted", "success");
    }).catch(function (err) {
      progress.style.display = "none";
      toast("Upload failed: " + (err.message || err), "error");
    });
  }

  // URL tab
  $("img-url-insert").addEventListener("click", function () {
    const url = ($("img-url").value || "").trim();
    if (!url) { toast("Please enter a URL", "warning"); return; }
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, "image", url, "user");
    quill.setSelection(range.index + 1);
    closeModal();
  });
}

function previewPost() {
  const data = collectEditorData();
  if (!data) return;
  const tagsHtml = (data.tags && data.tags.length)
    ? '<div class="preview-tags">' + data.tags.map(function (t) { return '<span class="preview-tag">' + esc(t) + '</span>'; }).join("") + '</div>'
    : "";
  showModal(
    '<div class="modal-backdrop"></div>' +
    '<div class="modal-dialog modal-dialog-lg">' +
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h3 class="modal-title">Preview</h3>' +
          '<button class="modal-close" data-modal-close aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<article class="preview-article">' +
            (data.cover_image
              ? '<div class="preview-cover"><img src="' + esc(data.cover_image) + '" alt=""></div>'
              : "") +
            '<div class="preview-category">' + esc(data.category || "Blog") + '</div>' +
            '<h1 class="preview-title">' + esc(data.title) + '</h1>' +
            '<div class="preview-meta">' +
              '<span>' + esc(fmtDateShort(new Date().toISOString())) + '</span>' +
              '<span>By ' + esc(data.author_name || "Admin") + '</span>' +
            '</div>' +
            (data.description ? '<p class="preview-description">' + esc(data.description) + '</p>' : "") +
            '<div class="preview-content">' + data.content_html + '</div>' +
            tagsHtml +
          '</article>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-secondary" data-modal-close>Close</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function collectEditorData() {
  const title = ($("ed-title").value || "").trim();
  const slug = ($("ed-slug").value || "").trim() || slugify(title);
  const category = ($("ed-category").value || "").trim();
  const status = $("ed-status").value;
  const description = ($("ed-description").value || "").trim();
  const author_name = ($("ed-author").value || "").trim() || "Admin";
  const author_email = ($("ed-author-email").value || "").trim();
  const author_image = ($("ed-author-image").value || "").trim();
  const author_description = ($("ed-author-desc").value || "").trim();
  const content_html = state.editor.quill ? state.editor.quill.root.innerHTML : "";
  const cover_image = state.editor.coverImage || "";

  if (!title) { toast("Title is required", "warning"); $("ed-title").focus(); return null; }
  if (!category) { toast("Category is required", "warning"); $("ed-category").focus(); return null; }
  if (!content_html || content_html === "<p><br></p>") { toast("Content is required", "warning"); return null; }

  return {
    title, slug, category, status, description,
    author_name, author_email, author_image, author_description,
    content_html, cover_image,
    tags: state.editor.tags.slice(),
    date_modified: new Date().toISOString()
  };
}

async function savePost(forceStatus) {
  const data = collectEditorData();
  if (!data) return;
  data.status = forceStatus || data.status || "draft";

  const saveBtn = document.querySelector(forceStatus === "published" ? "[data-save-publish]" : "[data-save-draft]");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving..."; }

  try {
    if (state.editor.editingId) {
      // Update existing
      const existing = state.posts.find(function (p) { return p._id === state.editor.editingId; });
      const date_published = (existing && existing.date_published) || new Date().toISOString();
      await updateDoc(doc(db, "blog_posts", state.editor.editingId), Object.assign({}, data, { date_published }));
      toast("Post updated successfully", "success");
    } else {
      // Create new
      await addDoc(collection(db, "blog_posts"), Object.assign({}, data, {
        date_published: new Date().toISOString(),
        createdAt: serverTimestamp()
      }));
      toast(data.status === "published" ? "Post published!" : "Draft saved", "success");
    }
    await loadPosts();
    updateSidebarBadges();
    navigateTo("posts");
  } catch (e) {
    console.error(e);
    toast("Save failed: " + (e.message || e.code), "error");
  } finally {
    if (saveBtn) { saveBtn.disabled = false; }
    if (document.querySelector("[data-save-draft]")) {
      document.querySelector("[data-save-draft]").textContent = state.editor.editingId ? "Save Changes" : "Save Draft";
    }
    if (document.querySelector("[data-save-publish]")) {
      document.querySelector("[data-save-publish]").textContent = "Publish";
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE: CATEGORIES
// ─────────────────────────────────────────────────────────────────────────
function renderCategories() {
  const counts = {};
  state.posts.forEach(function (p) {
    if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
  });
  const allCats = Array.from(new Set([].concat(state.categories, Object.keys(counts))));
  // Include any ad-hoc categories added but not in derived list

  els.adminContent.innerHTML =
    '<div class="page-header">' +
      '<div>' +
        '<h2 class="page-heading">Categories</h2>' +
        '<p class="page-subheading">Categories are derived from your published posts.</p>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><h3 class="card-title">Add Category</h3></div>' +
      '<div class="card-body">' +
        '<form id="add-cat-form" class="form-row">' +
          '<input type="text" id="new-cat-name" class="form-input" placeholder="e.g. Engineering" required>' +
          '<button type="submit" class="btn btn-primary">Add</button>' +
        '</form>' +
        '<div class="form-hint">Adding a category lets you assign it to posts immediately. It becomes permanent once used in a post.</div>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><h3 class="card-title">All Categories</h3></div>' +
      '<div class="card-body">' +
        (allCats.length === 0
          ? emptyState("No categories yet", "Add your first category above.")
          : '<div class="categories-list">' +
            allCats.map(function (c) {
              return '<div class="category-item">' +
                '<div class="category-item-main">' +
                  '<div class="category-item-name">' + esc(c) + '</div>' +
                  '<div class="category-item-count">' + esc(counts[c] || 0) + ' post' + ((counts[c] || 0) === 1 ? "" : "s") + '</div>' +
                '</div>' +
                '<button class="btn btn-secondary btn-sm btn-danger-outline" data-delete-category="' + esc(c) + '">Remove</button>' +
              '</div>';
            }).join("") +
          '</div>') +
      '</div>' +
    '</div>';

  $("add-cat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = ($("new-cat-name").value || "").trim();
    if (!name) return;
    if (state.categories.indexOf(name) === -1) {
      state.categories.push(name);
      state.categories.sort();
    }
    toast("Category added (will be saved with your next post)", "success");
    renderCategories();
  });
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE: MESSAGES
// ─────────────────────────────────────────────────────────────────────────
function renderMessages() {
  const filter = state.messagesFilter;
  const filtered = state.contacts.filter(function (c) {
    if (filter === "unread") return !c.is_read;
    if (filter === "read") return !!c.is_read;
    return true;
  });

  els.adminContent.innerHTML =
    '<div class="page-header">' +
      '<div>' +
        '<h2 class="page-heading">Messages</h2>' +
        '<p class="page-subheading">Contact form submissions from your website.</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-secondary" data-export-messages>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' +
          'Export CSV' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="posts-toolbar">' +
      '<div class="filter-tabs">' +
        '<button class="filter-tab ' + (filter === "all" ? "active" : "") + '" data-msg-filter="all">All <span class="filter-tab-count">' + state.contacts.length + '</span></button>' +
        '<button class="filter-tab ' + (filter === "unread" ? "active" : "") + '" data-msg-filter="unread">Unread <span class="filter-tab-count">' + state.contacts.filter(function (c) { return !c.is_read; }).length + '</span></button>' +
        '<button class="filter-tab ' + (filter === "read" ? "active" : "") + '" data-msg-filter="read">Read <span class="filter-tab-count">' + state.contacts.filter(function (c) { return !!c.is_read; }).length + '</span></button>' +
      '</div>' +
    '</div>' +

    '<div class="messages-list">' +
      (filtered.length === 0
        ? emptyState("No messages", "When someone submits the contact form, you'll see their message here.")
        : filtered.map(function (c) { return messageCard(c); }).join("")) +
    '</div>';
}

function messageCard(c) {
  const when = c.created_at ? fmtDate(c.created_at) : fmtDate(c.createdAt);
  return '<div class="message-card ' + (c.is_read ? "" : "unread") + '">' +
    '<div class="message-card-header">' +
      '<div class="message-card-avatar">' + esc((c.name || "?").charAt(0).toUpperCase()) + '</div>' +
      '<div class="message-card-meta">' +
        '<div class="message-card-name">' + esc(c.name || "(no name)") + '</div>' +
        '<div class="message-card-info">' +
          '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' +
          (c.phone ? ' &middot; ' + esc(c.phone) : '') +
        '</div>' +
      '</div>' +
      '<div class="message-card-time">' + esc(when) + '</div>' +
    '</div>' +
    (c.subject ? '<div class="message-card-subject"><strong>Subject:</strong> ' + esc(c.subject) + '</div>' : "") +
    '<div class="message-card-body">' + esc(c.message) + '</div>' +
    (c.is_read ? "" : '<div class="message-card-actions"><button class="btn btn-secondary btn-sm" data-mark-read="' + esc(c._id) + '">Mark as read</button></div>') +
  '</div>';
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE: NEWSLETTER
// ─────────────────────────────────────────────────────────────────────────
function renderNewsletter() {
  const q = state.newsletterSearch.toLowerCase();
  const filtered = state.newsletter.filter(function (s) {
    return (s.email || "").toLowerCase().includes(q);
  });

  els.adminContent.innerHTML =
    '<div class="page-header">' +
      '<div>' +
        '<h2 class="page-heading">Newsletter Subscribers</h2>' +
        '<p class="page-subheading">' + esc(state.newsletter.length) + ' subscriber' + (state.newsletter.length === 1 ? "" : "s") + '</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-secondary" data-export-newsletter>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' +
          'Export CSV' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="posts-toolbar">' +
      '<div class="search-box">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
        '<input type="search" id="newsletter-search" class="form-input" placeholder="Search by email..." value="' + esc(state.newsletterSearch) + '">' +
      '</div>' +
    '</div>' +

    '<div class="subscribers-list">' +
      (filtered.length === 0
        ? emptyState("No subscribers", "Footer email submissions will appear here.")
        : filtered.map(function (s) {
            const when = s.created_at ? fmtDate(s.created_at) : fmtDate(s.createdAt);
            return '<div class="subscriber-card">' +
              '<div class="subscriber-avatar">' + esc((s.email || "?").charAt(0).toUpperCase()) + '</div>' +
              '<div class="subscriber-main">' +
                '<div class="subscriber-email">' + esc(s.email) + '</div>' +
                '<div class="subscriber-time">' + esc(when) + '</div>' +
              '</div>' +
            '</div>';
          }).join("")) +
    '</div>';
}

// ─────────────────────────────────────────────────────────────────────────
// EVENT DELEGATION for #admin-content
// ─────────────────────────────────────────────────────────────────────────
els.adminContent.addEventListener("click", function (e) {
  // Navigate buttons
  const nav = e.target.closest("[data-navigate]");
  if (nav) {
    e.preventDefault();
    navigateTo(nav.dataset.navigate);
    return;
  }
  // Edit post
  const edit = e.target.closest("[data-edit-post]");
  if (edit) {
    e.preventDefault();
    navigateTo("create-post", { editId: edit.dataset.editPost });
    return;
  }
  // Delete post
  const del = e.target.closest("[data-delete-post]");
  if (del) {
    e.preventDefault();
    const id = del.dataset.deletePost;
    const post = state.posts.find(function (p) { return p._id === id; });
    confirmModal({
      title: "Delete post?",
      message: 'This will permanently delete "' + (post && post.title || "this post") + '". This action cannot be undone.',
      confirmText: "Delete",
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      deleteDoc(doc(db, "blog_posts", id))
        .then(function () {
          toast("Post deleted", "success");
          return loadPosts();
        })
        .then(function () {
          updateSidebarBadges();
          renderPosts();
        })
        .catch(function (err) { toast("Delete failed: " + err.message, "error"); });
    });
    return;
  }
  // Mark message read
  const read = e.target.closest("[data-mark-read]");
  if (read) {
    e.preventDefault();
    const id = read.dataset.markRead;
    updateDoc(doc(db, "contacts", id), { is_read: true })
      .then(function () {
        const c = state.contacts.find(function (x) { return x._id === id; });
        if (c) c.is_read = true;
        updateSidebarBadges();
        renderMessages();
        toast("Marked as read", "success");
      })
      .catch(function (err) { toast("Update failed: " + err.message, "error"); });
    return;
  }
  // Message filter
  const filter = e.target.closest("[data-msg-filter]");
  if (filter) {
    state.messagesFilter = filter.dataset.msgFilter;
    renderMessages();
    return;
  }
  // Delete category
  const delCat = e.target.closest("[data-delete-category]");
  if (delCat) {
    e.preventDefault();
    const name = delCat.dataset.deleteCategory;
    const count = state.posts.filter(function (p) { return p.category === name; }).length;
    confirmModal({
      title: "Remove category?",
      message: count > 0
        ? 'There ' + (count === 1 ? "is 1 post" : "are " + count + " posts") + ' using "' + name + '". They won\'t be deleted, but the category will no longer be available for new posts.'
        : 'Category "' + name + '" will be removed.',
      confirmText: "Remove",
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      state.categories = state.categories.filter(function (c) { return c !== name; });
      toast("Category removed", "success");
      renderCategories();
    });
    return;
  }
  // Export messages CSV
  const expMsg = e.target.closest("[data-export-messages]");
  if (expMsg) {
    e.preventDefault();
    const headers = ["name", "email", "phone", "subject", "message", "is_read", "created_at"];
    const rows = state.contacts.map(function (c) {
      return headers.map(function (h) {
        if (h === "created_at") return c.created_at || (c.createdAt && c.createdAt.toDate && c.createdAt.toDate().toISOString()) || "";
        if (h === "is_read") return c.is_read ? "yes" : "no";
        return c[h] || "";
      });
    });
    const csv = [headers.join(",")].concat(rows.map(function (r) { return r.map(csvEscape).join(","); })).join("\n");
    downloadBlob(csv, "messages-" + new Date().toISOString().slice(0, 10) + ".csv", "text/csv");
    toast("CSV exported", "success");
    return;
  }
  // Export newsletter CSV
  const expNews = e.target.closest("[data-export-newsletter]");
  if (expNews) {
    e.preventDefault();
    const headers = ["email", "subscribed_at"];
    const rows = state.newsletter.map(function (s) {
      return [s.email, s.created_at || (s.createdAt && s.createdAt.toDate && s.createdAt.toDate().toISOString()) || ""];
    });
    const csv = [headers.join(",")].concat(rows.map(function (r) { return r.map(csvEscape).join(","); })).join("\n");
    downloadBlob(csv, "newsletter-" + new Date().toISOString().slice(0, 10) + ".csv", "text/csv");
    toast("CSV exported", "success");
    return;
  }
  // Pagination
  const pagePrev = e.target.closest("[data-page-prev]");
  if (pagePrev && !pagePrev.disabled) { state.postsPage.page--; renderPosts(); return; }
  const pageNext = e.target.closest("[data-page-next]");
  if (pageNext && !pageNext.disabled) { state.postsPage.page++; renderPosts(); return; }
});

// Input delegation for filters
els.adminContent.addEventListener("input", function (e) {
  if (e.target.id === "posts-search") {
    state.postsPage.search = e.target.value;
    state.postsPage.page = 1;
    // debounce a bit
    clearTimeout(window._postsSearchTimer);
    window._postsSearchTimer = setTimeout(renderPosts, 200);
  } else if (e.target.id === "posts-category") {
    state.postsPage.category = e.target.value;
    state.postsPage.page = 1;
    renderPosts();
  } else if (e.target.id === "posts-status") {
    state.postsPage.status = e.target.value;
    state.postsPage.page = 1;
    renderPosts();
  } else if (e.target.id === "newsletter-search") {
    state.newsletterSearch = e.target.value;
    renderNewsletter();
  }
});
