// HI-NOVA APEX Public Loader — Industries
// Replaces the hardcoded industry cards in industries.html with live data from
// the CMS (GET /api/content/industries).
//
// Usage: include this script at the end of the body in industries.html.
// It will:
//   1. Fetch all industries (sorted by `order`)
//   2. Find the .industries-grid element
//   3. Replace its inner content with fresh industry card HTML
//   4. If CMS is unreachable, leave the static HTML in place (graceful fallback)
//
// To disable: remove the <script> tag — the static template renders as-is.

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1578356058390-f58c575337a2?w=400&h=250&fit=crop&auto=format';

  function renderCard(item, index) {
    var num = String(index + 1).padStart(2, '0');
    var image = item.image || DEFAULT_IMAGE;
    var alt = item.alt_text || item.title || 'Industry';
    return '<div class="industry-card">' +
      '<img class="industry-card-img" src="' + esc(image) + '" alt="' + esc(alt) + '" loading="lazy">' +
      '<div class="industry-card-body">' +
        '<div class="industry-card-number">' + esc(num) + '</div>' +
        '<h3>' + esc(item.title || '') + '</h3>' +
        '<p>' + esc(item.description || '') + '</p>' +
      '</div>' +
    '</div>';
  }

  async function load() {
    var grid = document.querySelector('.industries-grid');
    if (!grid) return;
    try {
      var apiBase = (document.querySelector('meta[name="api-base"]') || {}).content || '';
      var res = await fetch(apiBase + '/api/content/industries', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var json = await res.json();
      var items = (json && json.data) || [];
      if (!Array.isArray(items) || items.length === 0) return;
      // Filter active items and sort by order
      var active = items
        .filter(function (item) { return item.is_active !== false; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      if (active.length === 0) return;
      grid.innerHTML = active.map(function (item, i) { return renderCard(item, i); }).join('');
    } catch (e) {
      console.warn('[industries-loader] Could not load CMS data, keeping static content:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
