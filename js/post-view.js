// Renders a single Firestore blog post based on ?slug= in the URL.
// Uses the full Webflow template (navbar, sidebar, footer) and populates every
// field from Firestore. Also fetches the full collection once for the sidebar
// (Categories + Recent Posts) so admin-created posts show up everywhere.
import { auth, db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const PLACEHOLDER_IMG = "67512b0c631970a86b689e0a/6763feeeb839b368ca04a172_blog-img-01.jpg";

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

function safeImg(url) {
  if (!url) return "";
  if (/^https?:|^\/|^(data:)/i.test(url)) return url;
  return "";
}

function getSlug() {
  return new URLSearchParams(location.search).get("slug");
}

// Element refs (resolved in DOMContentLoaded in case script runs before parse)
function $(id) { return document.getElementById(id); }

const els = {
  title:        $("pv-title"),
  body:         $("pv-body"),
  cover:        $("pv-cover"),
  coverWrap:    $("pv-cover-wrap"),
  coverCat:     $("pv-cover-category"),
  metaDate:     $("pv-meta-date"),
  metaAuthor:   $("pv-meta-author"),
  authorBox:    $("pv-author-box"),
  authorName:   $("pv-author-name"),
  authorDesc:   $("pv-author-desc"),
  authorImage:  $("pv-author-image"),
  categories:   $("pv-categories"),
  recent:       $("pv-recent"),
};

function renderPost(post) {
  // Title + meta
  document.title = (post.title || "Blog Post") + " | HI-NOVA APEX LLP";
  if (els.title) els.title.textContent = post.title || "Untitled";

  if (els.metaDate) {
    const d = fmtDate(post.date_published);
    els.metaDate.textContent = d || "";
  }
  if (els.metaAuthor) {
    els.metaAuthor.textContent = "by " + (post.author_name || "admin");
  }

  // Cover
  const coverUrl = safeImg(post.cover_image);
  if (els.coverWrap) {
    if (coverUrl) {
      if (els.cover) {
        els.cover.src = coverUrl;
        els.cover.alt = post.title || "";
      }
      if (els.coverCat) els.coverCat.textContent = post.category || "Blog";
      els.coverWrap.style.display = "";
    } else {
      els.coverWrap.style.display = "none";
    }
  }

  // Body (authored by admin; trusted)
  if (els.body) els.body.innerHTML = post.content_html || "<p>(No content)</p>";

  // Tags — render as pills below the post body
  renderTags(post.tags);

  // Author box — show only if we have at least a name
  const hasAuthor = !!(post.author_name || post.author_image || post.author_description);
  if (els.authorBox) {
    if (hasAuthor) {
      if (els.authorName) els.authorName.textContent = post.author_name || "Admin";
      if (els.authorDesc) {
        const desc = (post.author_description || "").trim();
        if (desc) {
          els.authorDesc.textContent = desc;
          els.authorDesc.style.display = "";
        } else {
          els.authorDesc.style.display = "none";
        }
      }
      if (els.authorImage) {
        const img = safeImg(post.author_image);
        if (img) { els.authorImage.src = img; els.authorImage.style.display = ""; }
        else { els.authorImage.style.display = "none"; }
      }
      els.authorBox.style.display = "";
    } else {
      els.authorBox.style.display = "none";
    }
  }

  injectJsonLd(post);
}

function injectJsonLd(post) {
  // Remove any previous JSON-LD we injected
  document.querySelectorAll('script[data-pv-jsonld="1"]').forEach(function (n) { n.remove(); });
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title || "",
    "description": post.description || "",
    "image": post.cover_image || "",
    "datePublished": post.date_published || "",
    "dateModified": post.date_modified || post.date_published || "",
    "author": { "@type": "Person", "name": post.author_name || "Admin" },
    "articleSection": post.category || "",
    "inLanguage": "en"
  };
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.dataset.pvJsonld = "1";
  s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
}

function renderSidebar(allPosts, currentSlug) {
  // Categories — distinct, sorted alphabetically
  const cats = Array.from(new Set(
    allPosts.map(function (p) { return (p.category || "").trim(); }).filter(Boolean)
  )).sort(function (a, b) { return a.localeCompare(b); });

  if (els.categories) {
    if (!cats.length) {
      els.categories.innerHTML = '<li role="listitem" class="category-list w-dyn-item"><div class="category-link">No categories yet</div></li>';
    } else {
      els.categories.innerHTML = cats.map(function (c) {
        return '<li role="listitem" class="category-list w-dyn-item">' +
          '<a href="blog.html" class="category-link-wrap w-inline-block">' +
            '<div class="category-link">' + esc(c) + '</div>' +
          '</a>' +
        '</li>';
      }).join("");
    }
  }

  // Recent Posts — latest 4 by date_published, excluding current
  const recent = allPosts
    .filter(function (p) { return p.slug !== currentSlug; })
    .sort(function (a, b) { return new Date(b.date_published || 0) - new Date(a.date_published || 0); })
    .slice(0, 4);

  if (els.recent) {
    if (!recent.length) {
      els.recent.innerHTML = '<li role="listitem" class="w-dyn-item"><div class="category-link">No other posts yet</div></li>';
    } else {
      els.recent.innerHTML = recent.map(function (p) {
        const img = safeImg(p.cover_image) || PLACEHOLDER_IMG;
        return '<li role="listitem" class="w-dyn-item">' +
          '<a href="post-view.html?slug=' + encodeURIComponent(p.slug || "") + '" class="recent-blog w-inline-block">' +
            '<img alt="Blog" loading="lazy" src="' + esc(img) + '" class="recent-blog-image">' +
            '<div>' +
              '<div class="blog-meta-text-wrap blog-detail">' +
                '<div class="category global-text">' + esc(fmtDate(p.date_published)) + '</div>' +
              '</div>' +
              '<div class="recent-blog-title">' + esc(p.title) + '</div>' +
            '</div>' +
          '</a>' +
        '</li>';
      }).join("");
    }
  }
}

function renderNotFound(msg) {
  if (els.title) els.title.textContent = "Post not found";
  if (els.body) {
    els.body.innerHTML = '<p>' + esc(msg || "This post does not exist.") + ' <a href="blog.html">&larr; Back to blog</a>.</p>';
  }
  if (els.coverWrap) els.coverWrap.style.display = "none";
  if (els.authorBox) els.authorBox.style.display = "none";
  // Remove any stale tags block
  const stale = document.getElementById("pv-tags");
  if (stale) stale.remove();
}

function renderTags(tags) {
  // Remove any previously rendered block
  const existing = document.getElementById("pv-tags");
  if (existing) existing.remove();
  if (!Array.isArray(tags) || !tags.length) return;
  if (!els.body) return;
  const wrap = document.createElement("div");
  wrap.id = "pv-tags";
  wrap.className = "pv-tags";
  wrap.innerHTML = tags.map(function (t) {
    return '<span class="pv-tag">' + esc(String(t).trim()) + '</span>';
  }).join("");
  // Insert directly after the body element
  if (els.body.parentNode) {
    els.body.parentNode.insertBefore(wrap, els.body.nextSibling);
  }
}

(async function init() {
  const slug = getSlug();
  if (!slug) { renderNotFound("No post specified."); return; }

  try {
    const snap = await getDocs(collection(db, "blog_posts"));
    const rows = [];
    snap.forEach(function (d) { rows.push(Object.assign({ _id: d.id }, d.data())); });

    // Admins can preview drafts; everyone else can only see published posts.
    const isAdmin = !!auth.currentUser;
    const visible = isAdmin ? rows : rows.filter(function (p) { return (p.status || "published") !== "draft"; });

    const found = visible.find(function (p) { return p.slug === slug; });
    if (!found) { renderNotFound(); return; }
    renderPost(found);
    renderSidebar(visible, slug);
  } catch (err) {
    console.error(err);
    renderNotFound("Failed to load this post.");
  }
})();
