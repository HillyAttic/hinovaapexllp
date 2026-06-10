// HI-NOVA APEX Public Loader — Services
// Replaces the hardcoded service cards in services.html with live data from
// the CMS (GET /api/content/services).
//
// Usage: include this script at the end of the body in services.html.
// It will:
//   1. Fetch all services (sorted by `order`)
//   2. Find the .service-one-list (or .service-one-section .w-dyn-list) element
//   3. Replace its inner content with a fresh service card grid
//   4. If CMS is unreachable, leave the static HTML in place (graceful fallback)
//
// To disable: remove the <script> tag — the static template renders as-is.

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(u) {
    if (!u) return '';
    if (/^https?:|^\/|^(data:)/i.test(u)) return '';
    return u;
  }

  function renderCard(s) {
    const link = s.slug ? ('services/' + s.slug + '.html') : 'services.html';
    const image = safeUrl(s.image) || '67512b0c631970a86b689e0a/service-01.jpg';
    const features = Array.isArray(s.features) ? s.features : [];
    return `<div class="service-one-block w-dyn-item">
      <a href="${esc(link)}" class="service-card-link w-inline-block">
        <div class="service-one-image-wrap">
          <img loading="lazy" alt="${esc(s.title || 'Service')}" src="${esc(image)}" class="service-one-image">
        </div>
        <div class="service-one-content">
          <div class="category global-text">${esc(s.category || 'Service')}</div>
          <h2 class="service-one-title">${esc(s.title || '')}</h2>
          <p class="service-one-desc">${esc(s.summary || s.description || '')}</p>
          ${features.length ? '<ul class="service-one-features">' + features.slice(0, 4).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : ''}
        </div>
      </a>
    </div>`;
  }

  async function load() {
    // Try to find a services list container
    const candidates = [
      document.querySelector('.service-one-list'),
      document.querySelector('.service-one-section .w-dyn-list'),
      document.querySelector('[data-cms="services"]')
    ];
    const list = candidates.find(Boolean);
    if (!list) return;
    try {
      const apiBase = (document.querySelector('meta[name="api-base"]') || {}).content || '';
      const res = await fetch(apiBase + '/api/content/services', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const items = (json && json.data) || [];
      if (!Array.isArray(items) || items.length === 0) return;
      list.innerHTML = items.map(renderCard).join('');
    } catch (e) {
      console.warn('[services-loader] Could not load CMS data, keeping static content:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
