// Admin panel logic: Firebase Auth (email/password) + Firestore CRUD.
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---- Element refs ----
const loginView = document.getElementById("login-view");
const appView = document.getElementById("app-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const userEmailLabel = document.getElementById("user-email");

const tabs = document.querySelectorAll(".admin-tab");
const panels = document.querySelectorAll(".admin-panel");

// ---- Helpers ----
function show(el) { if (el) el.style.display = ""; }
function hide(el) { if (el) el.style.display = "none"; }
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
  if (isNaN(d.getTime())) return esc(v);
  return d.toLocaleString();
}

// ---- Auth ----
loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  hide(loginError);
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const btn = loginForm.querySelector("button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Signing in..."; }

  signInWithEmailAndPassword(auth, email, password)
    .catch(function (err) {
      loginError.textContent = mapAuthError(err.code);
      show(loginError);
    })
    .finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = "Sign In"; }
    });
});

function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-email": return "Invalid email address.";
    case "auth/user-disabled": return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Incorrect email or password.";
    case "auth/too-many-requests": return "Too many attempts. Try again later.";
    default: return "Sign in failed. Please try again.";
  }
}

logoutBtn.addEventListener("click", function () { signOut(auth); });

onAuthStateChanged(auth, function (user) {
  if (user) {
    hide(loginView);
    show(appView);
    if (userEmailLabel) userEmailLabel.textContent = user.email || "";
    loadPosts();
    loadContacts();
    loadNewsletter();
  } else {
    show(loginView);
    hide(appView);
  }
});

// ---- Tabs ----
tabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    tabs.forEach(function (t) { t.classList.remove("active"); });
    panels.forEach(function (p) { p.classList.remove("active"); });
    tab.classList.add("active");
    const panel = document.getElementById(tab.dataset.target);
    if (panel) panel.classList.add("active");
  });
});

// ---- Blog: create ----
const blogForm = document.getElementById("blog-form");
const blogMsg = document.getElementById("blog-msg");
const titleInput = document.getElementById("post-title");
const slugInput = document.getElementById("post-slug");

titleInput.addEventListener("blur", function () {
  if (!slugInput.value.trim() && titleInput.value.trim()) {
    slugInput.value = slugify(titleInput.value);
  }
});

blogForm.addEventListener("submit", function (e) {
  e.preventDefault();
  hide(blogMsg);

  const data = {
    slug: slugInput.value.trim() || slugify(titleInput.value),
    title: titleInput.value.trim(),
    description: document.getElementById("post-description").value.trim(),
    category: document.getElementById("post-category").value.trim(),
    author_name: document.getElementById("post-author").value.trim() || "Admin",
    cover_image: document.getElementById("post-cover").value.trim(),
    content_html: document.getElementById("post-content").value,
    date_published: new Date().toISOString(),
    date_modified: new Date().toISOString(),
    createdAt: serverTimestamp()
  };

  if (!data.title || !data.category || !data.content_html) {
    showMsg(blogMsg, "Title, category and content are required.", true);
    return;
  }

  const btn = blogForm.querySelector("button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Publishing..."; }

  addDoc(collection(db, "blog_posts"), data)
    .then(function () {
      showMsg(blogMsg, "Post published successfully.", false);
      blogForm.reset();
      loadPosts();
    })
    .catch(function (err) {
      console.error(err);
      showMsg(blogMsg, "Failed to publish: " + (err.message || err.code), true);
    })
    .finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = "Publish Post"; }
    });
});

function showMsg(el, text, isError) {
  if (!el) return;
  el.textContent = text;
  el.className = "admin-msg " + (isError ? "error" : "success");
  show(el);
}

// ---- Blog: list + delete ----
const postsList = document.getElementById("posts-list");

function loadPosts() {
  postsList.innerHTML = '<div class="admin-loading">Loading posts...</div>';
  getDocs(collection(db, "blog_posts"))
    .then(function (snap) {
      const rows = [];
      snap.forEach(function (d) { rows.push(Object.assign({ _id: d.id }, d.data())); });
      rows.sort(function (a, b) {
        return new Date(b.date_published || 0) - new Date(a.date_published || 0);
      });
      if (!rows.length) {
        postsList.innerHTML = '<div class="admin-empty">No posts yet.</div>';
        return;
      }
      postsList.innerHTML = rows.map(function (p) {
        return '<div class="admin-row">' +
          '<div class="admin-row-main">' +
            '<div class="admin-row-title">' + esc(p.title) + '</div>' +
            '<div class="admin-row-sub">' + esc(p.category) + ' &middot; ' + fmtDate(p.date_published) + '</div>' +
          '</div>' +
          '<div class="admin-row-actions">' +
            '<a class="admin-btn-link" href="post-view.html?slug=' + encodeURIComponent(p.slug) + '" target="_blank">View</a>' +
            '<button class="admin-btn-danger" data-del="' + esc(p._id) + '">Delete</button>' +
          '</div>' +
        '</div>';
      }).join("");
    })
    .catch(function (err) {
      postsList.innerHTML = '<div class="admin-msg error">Failed to load posts: ' + esc(err.message) + '</div>';
    });
}

postsList.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-del]");
  if (!btn) return;
  if (!confirm("Delete this post permanently?")) return;
  deleteDoc(doc(db, "blog_posts", btn.getAttribute("data-del")))
    .then(loadPosts)
    .catch(function (err) { alert("Delete failed: " + err.message); });
});

// ---- Contacts ----
const contactsList = document.getElementById("contacts-list");

function loadContacts() {
  contactsList.innerHTML = '<div class="admin-loading">Loading messages...</div>';
  getDocs(collection(db, "contacts"))
    .then(function (snap) {
      const rows = [];
      snap.forEach(function (d) { rows.push(Object.assign({ _id: d.id }, d.data())); });
      rows.sort(function (a, b) {
        return tsVal(b) - tsVal(a);
      });
      if (!rows.length) {
        contactsList.innerHTML = '<div class="admin-empty">No contact messages yet.</div>';
        return;
      }
      contactsList.innerHTML = rows.map(function (c) {
        const when = c.created_at ? fmtDate(c.created_at) : fmtDate(c.createdAt);
        return '<div class="admin-card' + (c.is_read ? '' : ' unread') + '">' +
          '<div class="admin-card-head">' +
            '<strong>' + esc(c.name || "(no name)") + '</strong>' +
            '<span class="admin-card-date">' + when + '</span>' +
          '</div>' +
          '<div class="admin-card-meta">' +
            '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' +
            (c.phone ? ' &middot; ' + esc(c.phone) : '') +
          '</div>' +
          (c.subject ? '<div class="admin-card-subject">Subject: ' + esc(c.subject) + '</div>' : '') +
          '<div class="admin-card-body">' + esc(c.message) + '</div>' +
          (c.is_read ? '' : '<button class="admin-btn-small" data-read="' + esc(c._id) + '">Mark as read</button>') +
        '</div>';
      }).join("");
    })
    .catch(function (err) {
      contactsList.innerHTML = '<div class="admin-msg error">Failed to load messages: ' + esc(err.message) + '</div>';
    });
}

function tsVal(c) {
  if (c.created_at) { const d = new Date(c.created_at); if (!isNaN(d)) return d.getTime(); }
  if (c.createdAt && typeof c.createdAt.toMillis === "function") return c.createdAt.toMillis();
  return 0;
}

contactsList.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-read]");
  if (!btn) return;
  updateDoc(doc(db, "contacts", btn.getAttribute("data-read")), { is_read: true })
    .then(loadContacts)
    .catch(function (err) { alert("Update failed: " + err.message); });
});

// ---- Newsletter ----
const newsletterList = document.getElementById("newsletter-list");

function loadNewsletter() {
  newsletterList.innerHTML = '<div class="admin-loading">Loading subscribers...</div>';
  // Try both collection names used by the project.
  Promise.all([
    safeGetAll("newsletter_subscribers"),
    safeGetAll("newsletter")
  ]).then(function (groups) {
    const seen = {};
    const rows = [];
    groups.forEach(function (g) {
      g.forEach(function (r) {
        const key = (r.email || "").toLowerCase();
        if (key && !seen[key]) { seen[key] = true; rows.push(r); }
      });
    });
    if (!rows.length) {
      newsletterList.innerHTML = '<div class="admin-empty">No subscribers yet.</div>';
      return;
    }
    newsletterList.innerHTML = rows.map(function (r) {
      const when = r.created_at ? fmtDate(r.created_at) : fmtDate(r.createdAt);
      return '<div class="admin-row">' +
        '<div class="admin-row-main"><div class="admin-row-title">' + esc(r.email) + '</div>' +
        '<div class="admin-row-sub">' + when + '</div></div></div>';
    }).join("");
  });
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
