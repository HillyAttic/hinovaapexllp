// HI-NOVA APEX Public Loader — Testimonials
// Replaces the hardcoded testimonial cards in the home page slider with live
// data from the CMS (GET /api/content/testimonials?is_featured=true).
//
// Usage: include this script at the end of the body in index.html (and any
// other page that should show testimonials). If CMS is unreachable, the
// static template renders as-is (graceful fallback).

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeUrl(u) {
    if (!u) return '';
    if (/^https?:|^\/|^(data:)/i.test(u)) return u;
    return '';
  }

  function renderCard(t) {
    const stars = '★'.repeat(Math.max(0, Math.min(5, Number(t.rating) || 5)));
    const image = safeUrl(t.author_image) || '67512b0c631970a86b689e0a/testimonial-01.jpg';
    return `<div class="testimonial-one-block w-dyn-item">
      <div class="testimonial-one-content">
        <div class="testimonial-quote-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M14 17h3l2-4V7h-6v6h3M6 17h3l2-4V7H5v6h3l-2 4z"></path></svg>
        </div>
        <p class="testimonial-one-desc">${esc(t.body || '')}</p>
        <div class="testimonial-rating">${esc(stars)}</div>
        <div class="testimonial-author">
          <img loading="lazy" alt="${esc(t.author_name || 'Client')}" src="${esc(image)}" class="testimonial-author-image">
          <div>
            <div class="testimonial-author-name">${esc(t.author_name || '')}</div>
            <div class="testimonial-author-role">${esc(t.author_role || '')}${t.author_company ? ' · ' + esc(t.author_company) : ''}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  async function load() {
    const candidates = [
      document.querySelector('.testimonial-one-list'),
      document.querySelector('.testimonial-one-section .w-dyn-list'),
      document.querySelector('[data-cms="testimonials"]')
    ];
    const list = candidates.find(Boolean);
    if (!list) return;
    try {
      const apiBase = (document.querySelector('meta[name="api-base"]') || {}).content || '';
      const res = await fetch(apiBase + '/api/content/testimonials', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const items = (json && json.data) || [];
      if (!Array.isArray(items) || items.length === 0) return;
      // Filter featured only
      const featured = items.filter(function (t) { return t.is_featured !== false; });
      if (featured.length === 0) return;
      list.innerHTML = featured.map(renderCard).join('');
    } catch (e) {
      console.warn('[testimonials-loader] Could not load CMS data, keeping static content:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
