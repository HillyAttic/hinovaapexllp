// Loads blog posts from Firestore and renders them on blog.html.
// On a successful fetch the Firestore posts REPLACE the static cards so the
// page is driven entirely by the database. If Firestore is unreachable, the
// original static cards remain as a fallback. Read access is public per rules.
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const PLACEHOLDER = "67512b0c631970a86b689e0a/6763feeeb839b368ca04a172_blog-img-01.jpg";

// All posts (seeded + admin-created) link to the dynamic viewer.
// The viewer now renders the same Webflow template as the legacy static pages.
function postHref(p) {
  return "post-view.html?slug=" + encodeURIComponent(p.slug || "");
}

function cardHtml(p) {
  // Accept http(s), site-relative, and data: URLs.
  const img = p.cover_image && /^https?:|^\/|^(data:)/i.test(p.cover_image) ? p.cover_image : PLACEHOLDER;
  return '' +
    '<div role="listitem" class="blog-section-item w-dyn-item">' +
      '<a href="' + esc(postHref(p)) + '" class="blog-one-link w-inline-block">' +
        '<div class="blog-one-image">' +
          '<img class="blog-one-preview" src="' + esc(img) + '" alt="' + esc(p.title) + '" loading="lazy">' +
          '<div class="blog-bottom-curve-wrap">' +
            '<div class="bottom-right-curve white"></div>' +
            '<div class="bottom-left-curve white"></div>' +
            '<div class="blog-category"><div class="category">' + esc(p.category || "Blog") + '</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="blog-one-content">' +
          '<div class="blog-one-tiitle">' + esc(p.title) + '</div>' +
          '<div class="blog-two-meta">' +
            '<div class="blog-meta-text-wrap"><div class="category">' + esc(fmtDate(p.date_published)) + '</div></div>' +
            '<div class="blog-meta-text-wrap"><div class="category">By ' + esc(p.author_name || "Admin") + '</div></div>' +
          '</div>' +
        '</div>' +
      '</a>' +
    '</div>';
}

(function () {
  const listContainer = document.querySelector(".blog-section-list.w-dyn-items");
  if (!listContainer) return;

  getDocs(collection(db, "blog_posts"))
    .then(function (snap) {
      const rows = [];
      snap.forEach(function (d) { rows.push(Object.assign({ _id: d.id }, d.data())); });
      if (!rows.length) return; // keep static fallback when collection is empty
      // Filter out drafts — they are admin-only and must not appear on the public blog.
      const published = rows.filter(function (p) {
        return (p.status || "published") !== "draft";
      });
      published.sort(function (a, b) {
        return new Date(b.date_published || 0) - new Date(a.date_published || 0);
      });
      // Replace the static cards with the database-driven ones.
      listContainer.innerHTML = published.map(cardHtml).join("");
    })
    .catch(function (err) {
      console.warn("Blog posts could not be loaded from Firestore; showing static fallback.", err);
    });
})();
