// HI-NOVA APEX Public Loader — Team Members
// Replaces the hardcoded team grid in our-team.html with live data from
// the CMS (GET /api/content/team_members).
//
// Usage: include this script at the end of the body in our-team.html.
// It will:
//   1. Fetch all team_members (sorted by `order`)
//   2. Find the <section class="team-one-section"> element
//   3. Replace its inner content with a fresh team grid
//   4. If CMS is unreachable, leave the static HTML in place (graceful fallback)
//
// To disable: remove the <script> tag — the static template renders as-is.

(function () {
  const SECTION_SEL = '.team-one-section';
  const LIST_SEL = '.team-one-list';

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

  function renderCard(m) {
    const image = safeUrl(m.image) || '67512b0c631970a86b689e0a/team-anonymous.svg';
    const link = m.slug ? ('team/' + m.slug + '.html') : 'our-team.html';
    const linkedin = m.linkedin ? `<a href="${esc(m.linkedin)}" target="_blank" rel="noopener" class="team-one-social-link" aria-label="LinkedIn">
      <svg viewBox="0 0 448 512" fill="currentColor" width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"></path></svg>
    </a>` : '';
    return `<div class="team-one-block w-dyn-item">
      <a href="${esc(link)}" class="team-one-image-wapper w-inline-block">
        <img loading="lazy" alt="${esc(m.name || 'Team member')}" src="${esc(image)}" class="team-one-image">
      </a>
      <div class="team-one-content">
        <a href="${esc(link)}" class="team-one-title-link w-inline-block">
          <h3 class="team-one-heading-title">${esc(m.name || '')}</h3>
        </a>
        <div class="team-one-designation">${esc(m.role || '')}</div>
        ${m.department ? `<div class="team-one-department">${esc(m.department)}</div>` : ''}
        <div class="team-one-social">${linkedin}</div>
      </div>
    </div>`;
  }

  async function load() {
    const section = document.querySelector(SECTION_SEL);
    if (!section) return;
    const list = section.querySelector(LIST_SEL) || section;
    try {
      const apiBase = (document.querySelector('meta[name="api-base"]') || {}).content || '';
      const res = await fetch(apiBase + '/api/content/team_members', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const items = (json && json.data) || [];
      if (!Array.isArray(items) || items.length === 0) return; // keep static fallback
      const active = items.filter(function (m) { return m.is_active !== false; });
      if (active.length === 0) return;
      list.innerHTML = active.map(renderCard).join('');
    } catch (e) {
      console.warn('[team-loader] Could not load CMS data, keeping static content:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
