// HI-NOVA APEX Admin Panel — Phase E extension.
// Manages 4 CMS collections: team_members, services, projects, testimonials.
// Loaded as a separate file from admin.html AFTER admin.js.
//
// All CMS routes go through the Cloudflare Worker (which uses the Firebase service
// account for auth, so no client credentials are exposed). Admin operations
// require a Bearer token — handled by the Worker. The admin panel is unlocked
// once Firebase Auth login succeeds; the Worker trusts the request if the
// Authorization header matches ADMIN_TOKEN (set via `wrangler secret put ADMIN_TOKEN`).
//
// Schema for each collection (free-form — anything you POST is stored):
//
// team_members: { name, role, slug, image, bio, experience, department,
//                qualification, linkedin, email, order, is_active }
// services:    { title, slug, category, summary, description, image,
//                features: [string], is_featured, order }
// projects:     { title, slug, category, client, location, year, summary,
//                description, image, gallery: [string], is_featured, order }
// testimonials: { author_name, author_role, author_company, author_image,
//                body, rating, is_featured, order }

// ─────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────
// Reuses API_BASE defined in api-config.js (loaded by admin.html)
// and ADMIN_TOKEN read from a meta tag (set in admin.html).

function adminToken() {
  const m = document.querySelector('meta[name="admin-token"]');
  return m ? m.getAttribute('content') : '';
}

async function adminFetch(path, opts) {
  opts = opts || {};
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    opts.headers || {}
  );
  const token = adminToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
  let json = null;
  try { json = await res.json(); } catch (e) { /* not JSON */ }
  if (!res.ok) {
    const err = (json && (json.error || json.message)) || ('HTTP ' + res.status);
    throw new Error(err);
  }
  return json;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function emptyState(title, body) {
  return '<div class="empty-state">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>' +
    '<h3 class="empty-state-title">' + esc(title) + '</h3>' +
    '<p class="empty-state-text">' + esc(body) + '</p>' +
  '</div>';
}

function toast(msg, type) {
  type = type || 'info';
  // Use the existing toast from admin.js if available, else console.log
  if (window.showToast) { window.showToast(msg, type); return; }
  if (window.adminToast) { window.adminToast(msg, type); return; }
  console.log('[' + type + ']', msg);
}

// ─────────────────────────────────────────────────────────────────────────
// COLLECTION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────
// Each entry defines: name, label, fields[] (form builder), listColumns[]
const CMS_COLLECTIONS = {
  team_members: {
    name: 'team_members',
    label: 'Team Members',
    singular: 'Team Member',
    description: 'Manage your leadership and engineering team.',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'role', label: 'Job Title / Role', type: 'text', required: true, placeholder: 'e.g. Managing Director' },
      { key: 'slug', label: 'URL Slug', type: 'text', placeholder: 'auto-generated-from-name', hint: 'Used in team detail page URLs.' },
      { key: 'department', label: 'Department', type: 'text', placeholder: 'e.g. Engineering, Production, Marketing' },
      { key: 'experience', label: 'Experience (years)', type: 'text', placeholder: 'e.g. 26+' },
      { key: 'qualification', label: 'Qualification', type: 'text', placeholder: 'e.g. Mechanical Engineering' },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'name@hinovaapex.com' },
      { key: 'linkedin', label: 'LinkedIn URL', type: 'text', placeholder: 'https://linkedin.com/in/...' },
      { key: 'image', label: 'Photo URL', type: 'text', placeholder: '/img/team/photo.jpg or full URL' },
      { key: 'bio', label: 'Short Bio / Profile', type: 'textarea', rows: 4, placeholder: 'Brief profile, expertise, achievements...' },
      { key: 'order', label: 'Display Order', type: 'number', placeholder: 'lower = first; leave blank for newest-first' },
      { key: 'is_active', label: 'Show on website', type: 'checkbox', default: true },
    ],
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'department', label: 'Department' },
      { key: 'is_active', label: 'Active', render: function (r) { return r.is_active ? '✓' : '—'; } },
    ],
  },
  services: {
    name: 'services',
    label: 'Services',
    singular: 'Service',
    description: 'Manage the service categories shown on the Services page.',
    fields: [
      { key: 'title', label: 'Service Title', type: 'text', required: true },
      { key: 'slug', label: 'URL Slug', type: 'text', placeholder: 'auto-generated-from-title' },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Process Equipment, Thermal' },
      { key: 'summary', label: 'Short Summary', type: 'text', placeholder: 'One-line tagline' },
      { key: 'description', label: 'Full Description', type: 'textarea', rows: 4 },
      { key: 'image', label: 'Image URL', type: 'text' },
      { key: 'features', label: 'Key Features (one per line)', type: 'textarea', rows: 5, transform: function (s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); } },
      { key: 'order', label: 'Display Order', type: 'number' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox', default: false, hint: 'Featured services appear prominently on the home page.' },
    ],
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'is_featured', label: 'Featured', render: function (r) { return r.is_featured ? '✓' : '—'; } },
    ],
  },
  projects: {
    name: 'projects',
    label: 'Projects',
    singular: 'Project',
    description: 'Manage project case studies shown on the Projects page.',
    fields: [
      { key: 'title', label: 'Project Title', type: 'text', required: true },
      { key: 'slug', label: 'URL Slug', type: 'text', placeholder: 'auto-generated-from-title' },
      { key: 'category', label: 'Sector / Category', type: 'text', placeholder: 'e.g. Process Equipment, Thermal Systems' },
      { key: 'client', label: 'Client', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'year', label: 'Year', type: 'text', placeholder: 'e.g. 2025' },
      { key: 'summary', label: 'Short Summary', type: 'text' },
      { key: 'description', label: 'Full Description', type: 'textarea', rows: 5 },
      { key: 'image', label: 'Cover Image URL', type: 'text' },
      { key: 'gallery', label: 'Gallery Image URLs (one per line)', type: 'textarea', rows: 4, transform: function (s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); } },
      { key: 'order', label: 'Display Order', type: 'number' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox', default: false },
    ],
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'year', label: 'Year' },
      { key: 'client', label: 'Client' },
      { key: 'is_featured', label: 'Featured', render: function (r) { return r.is_featured ? '✓' : '—'; } },
    ],
  },
  testimonials: {
    name: 'testimonials',
    label: 'Testimonials',
    singular: 'Testimonial',
    description: 'Manage client testimonials shown on the home page.',
    fields: [
      { key: 'author_name', label: 'Author Name', type: 'text', required: true },
      { key: 'author_role', label: 'Author Role / Title', type: 'text', placeholder: 'e.g. Plant Manager' },
      { key: 'author_company', label: 'Company', type: 'text' },
      { key: 'author_image', label: 'Author Photo URL', type: 'text' },
      { key: 'body', label: 'Testimonial Text', type: 'textarea', required: true, rows: 5 },
      { key: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5, default: 5 },
      { key: 'order', label: 'Display Order', type: 'number' },
      { key: 'is_featured', label: 'Show on home page', type: 'checkbox', default: true },
    ],
    listColumns: [
      { key: 'author_name', label: 'Author' },
      { key: 'author_company', label: 'Company' },
      { key: 'rating', label: 'Rating' },
      { key: 'is_featured', label: 'Featured', render: function (r) { return r.is_featured ? '✓' : '—'; } },
    ],
  },
};

// Per-collection state (items cache)
window.cmsState = window.cmsState || {};
Object.keys(CMS_COLLECTIONS).forEach(function (k) { window.cmsState[k] = { items: [], editingId: null, loading: false, error: null }; });

// ─────────────────────────────────────────────────────────────────────────
// LOADERS (one per collection)
// ─────────────────────────────────────────────────────────────────────────
async function loadCmsCollection(name) {
  const state = window.cmsState[name];
  state.loading = true; state.error = null;
  try {
    const res = await adminFetch('/api/admin/' + name);
    state.items = (res && res.data) || [];
    state.items.sort(function (a, b) {
      const ao = typeof a.order === 'number' ? a.order : 9999;
      const bo = typeof b.order === 'number' ? b.order : 9999;
      if (ao !== bo) return ao - bo;
      return String(a.name || a.title || a.author_name || '').localeCompare(String(b.name || b.title || b.author_name || ''));
    });
  } catch (e) {
    state.error = e.message || 'Failed to load';
    state.items = [];
  } finally {
    state.loading = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// FIELD RENDERER (form builder)
// ─────────────────────────────────────────────────────────────────────────
function renderFieldInput(field, value) {
  const id = 'cms-field-' + field.key;
  if (value === undefined || value === null) value = field.default !== undefined ? field.default : '';
  if (field.type === 'textarea') {
    const displayValue = Array.isArray(value) ? value.join('\n') : value;
    return '<div class="form-group">' +
      '<label class="form-label" for="' + id + '">' + esc(field.label) + (field.required ? ' <span class="required">*</span>' : '') + '</label>' +
      '<textarea id="' + id + '" name="' + field.key + '" class="form-input" rows="' + (field.rows || 4) + '" placeholder="' + esc(field.placeholder || '') + '">' + esc(displayValue) + '</textarea>' +
      (field.hint ? '<div class="form-hint">' + esc(field.hint) + '</div>' : '') +
    '</div>';
  }
  if (field.type === 'checkbox') {
    return '<div class="form-group form-group-checkbox">' +
      '<label class="form-checkbox-label">' +
        '<input type="checkbox" id="' + id + '" name="' + field.key + '"' + (value ? ' checked' : '') + '>' +
        '<span>' + esc(field.label) + '</span>' +
      '</label>' +
      (field.hint ? '<div class="form-hint">' + esc(field.hint) + '</div>' : '') +
    '</div>';
  }
  if (field.type === 'number') {
    return '<div class="form-group">' +
      '<label class="form-label" for="' + id + '">' + esc(field.label) + (field.required ? ' <span class="required">*</span>' : '') + '</label>' +
      '<input type="number" id="' + id + '" name="' + field.key + '" class="form-input" value="' + esc(value) + '"' + (field.min !== undefined ? ' min="' + field.min + '"' : '') + (field.max !== undefined ? ' max="' + field.max + '"' : '') + ' placeholder="' + esc(field.placeholder || '') + '">' +
      (field.hint ? '<div class="form-hint">' + esc(field.hint) + '</div>' : '') +
    '</div>';
  }
  // text
  return '<div class="form-group">' +
    '<label class="form-label" for="' + id + '">' + esc(field.label) + (field.required ? ' <span class="required">*</span>' : '') + '</label>' +
    '<input type="text" id="' + id + '" name="' + field.key + '" class="form-input" value="' + esc(value) + '" placeholder="' + esc(field.placeholder || '') + '">' +
    (field.hint ? '<div class="form-hint">' + esc(field.hint) + '</div>' : '') +
  '</div>';
}

function readFieldFromForm(field) {
  const el = document.getElementById('cms-field-' + field.key);
  if (!el) return field.default !== undefined ? field.default : '';
  if (field.type === 'checkbox') return el.checked;
  if (field.type === 'number') {
    const v = el.value.trim();
    if (v === '') return field.default !== undefined ? field.default : null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
  const raw = el.value;
  if (field.transform) return field.transform(raw);
  return raw;
}

// ─────────────────────────────────────────────────────────────────────────
// PAGE RENDERERS (list + editor)
// ─────────────────────────────────────────────────────────────────────────
function renderCmsListPage(collectionName) {
  const def = CMS_COLLECTIONS[collectionName];
  const state = window.cmsState[collectionName];
  const items = state.items;

  if (state.error) {
    return '<div class="page-header"><h2 class="page-heading">' + esc(def.label) + '</h2></div>' +
      '<div class="card"><div class="card-body error-state">' + esc(state.error) +
      '<br><button class="btn btn-primary" data-retry-cms="' + collectionName + '">Retry</button></div></div>';
  }

  if (state.loading && items.length === 0) {
    return '<div class="page-header"><h2 class="page-heading">' + esc(def.label) + '</h2></div>' +
      '<div class="card"><div class="card-body">Loading...</div></div>';
  }

  let html = '<div class="page-header">' +
    '<div>' +
      '<h2 class="page-heading">' + esc(def.label) + '</h2>' +
      '<p class="page-subheading">' + esc(def.description) + '</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-primary" data-create-cms="' + collectionName + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
        'New ' + esc(def.singular) +
      '</button>' +
    '</div>' +
  '</div>';

  if (items.length === 0) {
    html += '<div class="card"><div class="card-body">' + emptyState(
      'No ' + def.label.toLowerCase() + ' yet',
      'Click "New ' + def.singular + '" above to add your first entry.'
    ) + '</div></div>';
  } else {
    html += '<div class="card"><div class="card-body">' +
      '<table class="data-table"><thead><tr>';
    def.listColumns.forEach(function (c) {
      html += '<th>' + esc(c.label) + '</th>';
    });
    html += '<th class="actions-col">Actions</th></tr></thead><tbody>';
    items.forEach(function (it) {
      html += '<tr>';
      def.listColumns.forEach(function (c) {
        const val = c.render ? c.render(it) : (it[c.key] != null ? it[c.key] : '—');
        const display = (typeof val === 'string' || typeof val === 'number') ? String(val) : '—';
        html += '<td>' + esc(display) + '</td>';
      });
      html += '<td class="actions-col"><button class="btn-icon" data-edit-cms="' + collectionName + '" data-cms-id="' + esc(it._id) + '" title="Edit">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
      '</button> <button class="btn-icon btn-icon-danger" data-delete-cms="' + collectionName + '" data-cms-id="' + esc(it._id) + '" title="Delete">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>' +
      '</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
  }

  return html;
}

function renderCmsEditorPage(collectionName) {
  const def = CMS_COLLECTIONS[collectionName];
  const state = window.cmsState[collectionName];
  const isEdit = !!state.editingId;
  const item = isEdit ? state.items.find(function (x) { return x._id === state.editingId; }) : null;

  let html = '<div class="page-header">' +
    '<div>' +
      '<h2 class="page-heading">' + (isEdit ? 'Edit ' + def.singular : 'New ' + def.singular) + '</h2>' +
      '<p class="page-subheading">' + (isEdit ? 'Update this ' + def.singular.toLowerCase() : 'Add a new ' + def.singular.toLowerCase() + ' to your site.') + '</p>' +
    '</div>' +
    '<div class="page-actions">' +
      '<button class="btn btn-secondary" data-cancel-cms="' + collectionName + '">Cancel</button>' +
    '</div>' +
  '</div>';

  html += '<form id="cms-form-' + collectionName + '" class="editor-layout">';
  html += '<div class="card"><div class="card-body">';
  def.fields.forEach(function (f) {
    const value = item ? item[f.key] : (f.default !== undefined ? f.default : '');
    html += renderFieldInput(f, value);
  });
  html += '</div></div>';

  html += '<div class="form-actions">' +
    '<button type="button" class="btn btn-secondary" data-cancel-cms="' + collectionName + '">Cancel</button>' +
    '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Save Changes' : 'Create ' + def.singular) + '</button>' +
  '</div>';
  html += '</form>';

  return html;
}

// ─────────────────────────────────────────────────────────────────────────
// REGISTER PAGES into the admin PAGES object
// ─────────────────────────────────────────────────────────────────────────
// We need to hook into the existing admin's PAGES. Expose a registration
// function that the page-include script calls after admin.js is loaded.

window.CMS = {
  collections: CMS_COLLECTIONS,
  loadCollection: loadCmsCollection,
  renderList: renderCmsListPage,
  renderEditor: renderCmsEditorPage,
  saveItem: async function (collectionName, id, data) {
    if (id) return adminFetch('/api/admin/' + collectionName + '/' + id, { method: 'PUT', body: JSON.stringify(data) });
    return adminFetch('/api/admin/' + collectionName, { method: 'POST', body: JSON.stringify(data) });
  },
  deleteItem: async function (collectionName, id) {
    return adminFetch('/api/admin/' + collectionName + '/' + id, { method: 'DELETE' });
  },
  // Hook into the existing PAGES dict from admin.js
  registerPages: function (PAGES) {
    if (!PAGES) return;
    Object.keys(CMS_COLLECTIONS).forEach(function (name) {
      const listName = 'cms-' + name;
      const editName = 'cms-edit-' + name;
      PAGES[listName] = {
        title: CMS_COLLECTIONS[name].label,
        render: async function () {
          await loadCmsCollection(name);
          const el = document.getElementById('admin-content');
          if (el) el.innerHTML = renderCmsListPage(name);
        },
      };
      PAGES[editName] = {
        title: (window.cmsState[name].editingId ? 'Edit ' : 'New ') + CMS_COLLECTIONS[name].singular,
        render: function () {
          const el = document.getElementById('admin-content');
          if (el) el.innerHTML = renderCmsEditorPage(name);
          // Wire up form submit
          const form = document.getElementById('cms-form-' + name);
          if (form) {
            form.addEventListener('submit', async function (e) {
              e.preventDefault();
              const data = {};
              CMS_COLLECTIONS[name].fields.forEach(function (f) {
                data[f.key] = readFieldFromForm(f);
              });
              // Auto-generate slug if missing
              if (CMS_COLLECTIONS[name].fields.some(function (f) { return f.key === 'slug'; }) && !data.slug) {
                const source = data.name || data.title || data.author_name || '';
                data.slug = slugify(source);
              }
              try {
                await window.CMS.saveItem(name, window.cmsState[name].editingId, data);
                toast('Saved.', 'success');
                if (window.navigateTo) window.navigateTo(listName);
                else window.location.hash = listName;
              } catch (err) {
                toast('Save failed: ' + (err.message || err), 'error');
              }
            });
          }
        },
      };
    });
  },
  // Auto-register with admin.js's PAGES when both scripts are loaded.
  autoRegister: function () {
    function tryRegister() {
      if (window.PAGES && typeof window.navigateTo === 'function') {
        window.CMS.registerPages(window.PAGES);
        return true;
      }
      return false;
    }
    if (!tryRegister()) {
      // admin.js may not have exposed PAGES yet — retry on next tick
      let attempts = 0;
      const interval = setInterval(function () {
        attempts++;
        if (tryRegister() || attempts > 50) clearInterval(interval);
      }, 40);
    }
  },
  // Wire up click handlers (called after PAGES are registered and DOM is ready)
  wireEvents: function () {
    document.addEventListener('click', async function (e) {
      const newBtn = e.target.closest('[data-create-cms]');
      if (newBtn) {
        const name = newBtn.getAttribute('data-create-cms');
        window.cmsState[name].editingId = null;
        if (window.navigateTo) window.navigateTo('cms-edit-' + name);
        return;
      }
      const editBtn = e.target.closest('[data-edit-cms]');
      if (editBtn) {
        const name = editBtn.getAttribute('data-edit-cms');
        const id = editBtn.getAttribute('data-cms-id');
        window.cmsState[name].editingId = id;
        if (window.navigateTo) window.navigateTo('cms-edit-' + name);
        return;
      }
      const delBtn = e.target.closest('[data-delete-cms]');
      if (delBtn) {
        const name = delBtn.getAttribute('data-delete-cms');
        const id = delBtn.getAttribute('data-cms-id');
        const item = window.cmsState[name].items.find(function (x) { return x._id === id; });
        const label = item ? (item.name || item.title || item.author_name || 'this entry') : 'this entry';
        if (!confirm('Delete "' + label + '"? This cannot be undone.')) return;
        try {
          await window.CMS.deleteItem(name, id);
          toast('Deleted.', 'success');
          await loadCmsCollection(name);
          if (window.navigateTo) window.navigateTo('cms-' + name);
        } catch (err) {
          toast('Delete failed: ' + (err.message || err), 'error');
        }
        return;
      }
      const cancelBtn = e.target.closest('[data-cancel-cms]');
      if (cancelBtn) {
        const name = cancelBtn.getAttribute('data-cancel-cms');
        window.cmsState[name].editingId = null;
        if (window.navigateTo) window.navigateTo('cms-' + name);
        return;
      }
      const retryBtn = e.target.closest('[data-retry-cms]');
      if (retryBtn) {
        const name = retryBtn.getAttribute('data-retry-cms');
        if (window.navigateTo) window.navigateTo('cms-' + name);
        return;
      }
    });
  },
};

// Auto-wire events and register pages when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    window.CMS.wireEvents();
    window.CMS.autoRegister();
  });
} else {
  window.CMS.wireEvents();
  window.CMS.autoRegister();
}
