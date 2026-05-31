// Loads admin-created blog posts from Firestore and prepends them to the
// existing static cards on blog.html. Read access is public per security rules.
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

function cardHtml(p) {
  const img = p.cover_image && /^https?:|^67512b/.test(p.cover_image) ? p.cover_image : PLACEHOLDER;
  const href = "post-view.html?slug=" + encodeURIComponent(p.slug);
  return '' +
    '<div role="listitem" class="blog-section-item w-dyn-item">' +
      '<a href="' + href + '" class="blog-one-link w-inline-block">' +
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
      if (!rows.length) return;
      rows.sort(function (a, b) {
        return new Date(b.date_published || 0) - new Date(a.date_published || 0);
      });
      const html = rows.map(cardHtml).join("");
      listContainer.insertAdjacentHTML("afterbegin", html);
    })
    .catch(function (err) {
      console.warn("Blog posts could not be loaded from Firestore:", err);
    });
})();
