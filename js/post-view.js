// Renders a single Firestore blog post based on ?slug= in the URL.
import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function fmtDate(v) {
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const titleEl = document.getElementById("pv-title");
const bodyEl = document.getElementById("pv-body");
const metaEl = document.getElementById("pv-meta");
const coverEl = document.getElementById("pv-cover");

function getSlug() {
  return new URLSearchParams(location.search).get("slug");
}

function render(post) {
  document.title = post.title + " | HI-NOVA APEX LLP";
  if (titleEl) titleEl.textContent = post.title;
  if (metaEl) {
    metaEl.textContent = [fmtDate(post.date_published), post.category, "By " + (post.author_name || "Admin")]
      .filter(Boolean).join("  \u00b7  ");
  }
  if (coverEl) {
    if (post.cover_image) {
      coverEl.src = post.cover_image;
      coverEl.style.display = "";
    } else {
      coverEl.style.display = "none";
    }
  }
  // content_html is authored in the admin panel by a trusted, authenticated admin.
  if (bodyEl) bodyEl.innerHTML = post.content_html || "";
}

function renderNotFound(msg) {
  if (titleEl) titleEl.textContent = "Post not found";
  if (metaEl) metaEl.textContent = "";
  if (coverEl) coverEl.style.display = "none";
  if (bodyEl) bodyEl.innerHTML = '<p>' + esc(msg || "This post does not exist.") + ' <a href="blog.html">Back to blog</a>.</p>';
}

(function () {
  const slug = getSlug();
  if (!slug) { renderNotFound("No post specified."); return; }

  const q = query(collection(db, "blog_posts"), where("slug", "==", slug));
  getDocs(q)
    .then(function (snap) {
      if (snap.empty) { renderNotFound(); return; }
      render(snap.docs[0].data());
    })
    .catch(function (err) {
      console.error(err);
      renderNotFound("Failed to load this post.");
    });
})();
