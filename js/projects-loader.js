// HI-NOVA APEX Public Loader — Projects
// Replaces the hardcoded project cards in projects.html with live data from
// the CMS (GET /api/content/projects).
//
// Usage: include this script at the end of the body in projects.html.
// If CMS is unreachable, the static template renders as-is (graceful fallback).

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

  function renderCard(p) {
    const link = p.slug ? ('project/' + p.slug + '.html') : 'projects.html';
    const image = safeUrl(p.image) || '67512b0c631970a86b689e0a/project-img-001.jpg';
    return `<div class="project-one-block w-dyn-item">
      <a href="${esc(link)}" class="project-card-link w-inline-block">
        <div class="project-one-image-wrap">
          <img loading="lazy" alt="${esc(p.title || 'Project')}" src="${esc(image)}" class="project-one-image">
        </div>
        <div class="project-one-content">
          <div class="category global-text">${esc(p.category || 'Project')}</div>
          <h2 class="project-one-title">${esc(p.title || '')}</h2>
          ${p.client ? `<div class="project-one-client">${esc(p.client)}${p.year ? ' · ' + esc(p.year) : ''}</div>` : ''}
          <p class="project-one-desc">${esc(p.summary || p.description || '')}</p>
        </div>
      </a>
    </div>`;
  }

  async function load() {
    const candidates = [
      document.querySelector('.project-one-list'),
      document.querySelector('.project-one-section .w-dyn-list'),
      document.querySelector('[data-cms="projects"]')
    ];
    const list = candidates.find(Boolean);
    if (!list) return;
    try {
      const apiBase = (document.querySelector('meta[name="api-base"]') || {}).content || '';
      const res = await fetch(apiBase + '/api/content/projects', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const items = (json && json.data) || [];
      if (!Array.isArray(items) || items.length === 0) return;
      list.innerHTML = items.map(renderCard).join('');
    } catch (e) {
      console.warn('[projects-loader] Could not load CMS data, keeping static content:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
