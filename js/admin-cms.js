// HI-NOVA APEX Admin Panel — Phase E extension.
// Manages 4 CMS collections: team_members, services, projects, testimonials.
// Loaded as a separate file from admin.html AFTER admin.js.
//
// Uses Firebase client SDK directly (same pattern as admin.js) for all
// Firestore operations. No Worker API dependency.
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
// FIREBASE IMPORTS
// ─────────────────────────────────────────────────────────────────────────
import { db } from "./firebase-config.js";
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
  query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────
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
    '<div class="empty-state-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>' +
    '</div>' +
    '<div class="empty-state-title">' + esc(title) + '</div>' +
    '<div class="empty-state-message">' + esc(body) + '</div>' +
  '</div>';
}

function toast(msg, type) {
  type = type || 'info';
  if (window.showToast) { window.showToast(msg, type); return; }
  if (window.adminToast) { window.adminToast(msg, type); return; }
  console.log('[' + type + ']', msg);
}

// ─────────────────────────────────────────────────────────────────────────
// COLLECTION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────
const CMS_COLLECTIONS = {
  team_members: {
    name: 'team_members',
    label: 'Team Members',
    singular: 'Team Member',
    description: 'Manage your leadership and engineering team.',
    viewUrl: 'our-team.html',
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
      { key: 'is_featured', label: 'Show on homepage Core Team', type: 'checkbox', default: false, hint: 'Featured members appear in the Core Team section on the home page.' },
    ],
    listColumns: [
      { key: 'name', label: 'Name', render: function (r) {
        var thumb = r.image ? '<img class="cms-thumb" src="' + esc(r.image) + '" alt="" onerror="this.style.display=\'none\'">' : '';
        return '<div class="cms-row-with-thumb">' + thumb + '<div class="cms-row-text"><div class="cms-row-title">' + esc(r.name || '—') + '</div><div class="cms-row-subtitle">' + esc(r.role || '') + '</div></div></div>';
      }},
      { key: 'department', label: 'Department', render: function (r) { return r.department ? '<span class="cms-badge category">' + esc(r.department) + '</span>' : '—'; } },
      { key: 'is_active', label: 'Status', render: function (r) { return r.is_active ? '<span class="cms-badge featured">Active</span>' : '<span class="cms-badge not-featured">Inactive</span>'; } },
      { key: 'is_featured', label: 'Homepage', render: function (r) { return r.is_featured ? '<span class="cms-badge featured">Featured</span>' : '<span class="cms-badge not-featured">—</span>'; } },
    ],
  },
  services: {
    name: 'services',
    label: 'Services',
    singular: 'Service',
    description: 'Manage the service categories shown on the Services page.',
    viewUrl: 'services.html',
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
      { key: 'title', label: 'Service', render: function (r) {
        var thumb = r.image ? '<img class="cms-thumb" src="' + esc(r.image) + '" alt="" onerror="this.style.display=\'none\'">' : '';
        return '<div class="cms-row-with-thumb">' + thumb + '<div class="cms-row-text"><div class="cms-row-title">' + esc(r.title || '—') + '</div><div class="cms-row-subtitle">' + esc(r.summary || '') + '</div></div></div>';
      }},
      { key: 'category', label: 'Category', render: function (r) { return r.category ? '<span class="cms-badge category">' + esc(r.category) + '</span>' : '—'; } },
      { key: 'is_featured', label: 'Featured', render: function (r) { return r.is_featured ? '<span class="cms-badge featured">Featured</span>' : '<span class="cms-badge not-featured">Standard</span>'; } },
    ],
  },
  projects: {
    name: 'projects',
    label: 'Projects',
    singular: 'Project',
    description: 'Manage project case studies shown on the Projects page.',
    viewUrl: 'projects.html',
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
      { key: 'title', label: 'Project', render: function (r) {
        var thumb = r.image ? '<img class="cms-thumb" src="' + esc(r.image) + '" alt="" onerror="this.style.display=\'none\'">' : '';
        return '<div class="cms-row-with-thumb">' + thumb + '<div class="cms-row-text"><div class="cms-row-title">' + esc(r.title || '—') + '</div><div class="cms-row-subtitle">' + esc(r.summary || '') + '</div></div></div>';
      }},
      { key: 'category', label: 'Category', render: function (r) { return r.category ? '<span class="cms-badge category">' + esc(r.category) + '</span>' : '—'; } },
      { key: 'client', label: 'Client', render: function (r) { return r.client ? esc(r.client) : '<span style="color:var(--muted)">—</span>'; } },
      { key: 'is_featured', label: 'Featured', render: function (r) { return r.is_featured ? '<span class="cms-badge featured">Featured</span>' : '<span class="cms-badge not-featured">Standard</span>'; } },
    ],
  },
  testimonials: {
    name: 'testimonials',
    label: 'Testimonials',
    singular: 'Testimonial',
    description: 'Manage client testimonials shown on the home page.',
    viewUrl: 'index.html',
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
      { key: 'author_name', label: 'Author', render: function (r) {
        var thumb = r.author_image ? '<img class="cms-thumb" style="border-radius:50%" src="' + esc(r.author_image) + '" alt="" onerror="this.style.display=\'none\'">' : '';
        return '<div class="cms-row-with-thumb">' + thumb + '<div class="cms-row-text"><div class="cms-row-title">' + esc(r.author_name || '—') + '</div><div class="cms-row-subtitle">' + esc(r.author_role || '') + '</div></div></div>';
      }},
      { key: 'author_company', label: 'Company', render: function (r) { return r.author_company ? esc(r.author_company) : '<span style="color:var(--muted)">—</span>'; } },
      { key: 'rating', label: 'Rating', render: function (r) {
        var rating = parseInt(r.rating) || 0;
        var stars = '';
        for (var i = 1; i <= 5; i++) {
          if (i <= rating) {
            stars += '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
          } else {
            stars += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color:#d1d5db"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
          }
        }
        return '<div class="cms-stars">' + stars + '</div>';
      }},
      { key: 'is_featured', label: 'Featured', render: function (r) { return r.is_featured ? '<span class="cms-badge featured">Visible</span>' : '<span class="cms-badge not-featured">Hidden</span>'; } },
    ],
  },
  industries: {
    name: 'industries',
    label: 'Industries',
    singular: 'Industry',
    description: 'Manage the industry cards shown on the Industries page.',
    viewUrl: 'industries.html',
    fields: [
      { key: 'title', label: 'Industry Name', type: 'text', required: true, placeholder: 'e.g. Oil & Gas' },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Brief description of services for this industry' },
      { key: 'image', label: 'Image URL', type: 'text', placeholder: 'https://... or /img/industries/...' },
      { key: 'alt_text', label: 'Image Alt Text', type: 'text', placeholder: 'Descriptive alt text for accessibility' },
      { key: 'order', label: 'Display Order', type: 'number', placeholder: 'lower = first' },
      { key: 'is_active', label: 'Show on website', type: 'checkbox', default: true },
    ],
    listColumns: [
      { key: 'title', label: 'Industry', render: function (r) {
        var thumb = r.image ? '<img class="cms-thumb" src="' + esc(r.image) + '" alt="" onerror="this.style.display=\'none\'">' : '';
        return '<div class="cms-row-with-thumb">' + thumb + '<div class="cms-row-text"><div class="cms-row-title">' + esc(r.title || '—') + '</div><div class="cms-row-subtitle">' + esc(r.description || '').substring(0, 80) + '...</div></div></div>';
      }},
      { key: 'order', label: 'Order', render: function (r) { return typeof r.order === 'number' ? '<span class="cms-badge category">' + String(r.order).padStart(2, '0') + '</span>' : '—'; } },
      { key: 'is_active', label: 'Status', render: function (r) { return r.is_active !== false ? '<span class="cms-badge featured">Active</span>' : '<span class="cms-badge not-featured">Hidden</span>'; } },
    ],
  },
};

// Per-collection state (items cache)
window.cmsState = window.cmsState || {};
Object.keys(CMS_COLLECTIONS).forEach(function (k) { window.cmsState[k] = { items: [], editingId: null, loading: false, error: null }; });

// ─────────────────────────────────────────────────────────────────────────
// FIRESTORE CRUD (Firebase client SDK)
// ─────────────────────────────────────────────────────────────────────────
async function loadCmsCollection(name) {
  const state = window.cmsState[name];
  state.loading = true;
  state.error = null;
  try {
    const q = query(collection(db, name), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    state.items = snapshot.docs.map(function (d) {
      return Object.assign({ _id: d.id }, d.data());
    });
    // Secondary sort: by name/title/author_name alphabetically for same order
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

// Auto-seed a collection if it's empty (copies frontend data into Firestore)
async function autoSeedCollection(name) {
  if (name === 'team_members' && window.cmsState[name].items.length === 0) {
    var seedData = [
      { name: "Rohidas R. Sharma", role: "Managing Director", slug: "rohidas-sharma", department: "Management", experience: "26+", qualification: "Mechanical Engineering", email: "rohidas@hinovaapex.com", linkedin: "", image: "67512b0c631970a86b689e0a/team-anonymous.svg", bio: "Leading HI-NOVA APEX with 26+ years of engineering and manufacturing expertise.", order: 1, is_active: true, is_featured: true },
      { name: "Manoj A. P", role: "Director", slug: "manoj-ap", department: "Management", experience: "20+", qualification: "Business Administration", email: "manoj@hinovaapex.com", linkedin: "", image: "67512b0c631970a86b689e0a/team-anonymous.svg", bio: "Strategic leadership and business development for HI-NOVA APEX.", order: 2, is_active: true, is_featured: true },
      { name: "Vishal Sakat", role: "Production Head", slug: "vishal-sakat", department: "Production", experience: "15+", qualification: "Mechanical Engineering", email: "vishal@hinovaapex.com", linkedin: "", image: "67512b0c631970a86b689e0a/team-anonymous.svg", bio: "Overseeing production operations and manufacturing excellence.", order: 3, is_active: true, is_featured: true },
      { name: "Hardik Panchal", role: "Marketing Head", slug: "hardik-panchal", department: "Marketing", experience: "12+", qualification: "Marketing & Business", email: "hardik@hinovaapex.com", linkedin: "", image: "67512b0c631970a86b689e0a/team-anonymous.svg", bio: "Driving brand growth and market presence for HI-NOVA APEX.", order: 4, is_active: true, is_featured: true },
      { name: "Arvind Kumar Sharma", role: "Director", slug: "arvind-kumar-sharma", department: "Management", experience: "18+", qualification: "Engineering", email: "arvind@hinovaapex.com", linkedin: "", image: "67512b0c631970a86b689e0a/team-anonymous.svg", bio: "Strategic direction and operational oversight.", order: 5, is_active: true, is_featured: false },
      { name: "HI-NOVA Engineering Team", role: "Quality & Inspection", slug: "hi-nova-engineering-team", department: "Engineering", experience: "", qualification: "", email: "", linkedin: "", image: "67512b0c631970a86b689e0a/team-anonymous.svg", bio: "Our dedicated engineering team ensuring quality and precision in every project.", order: 6, is_active: true, is_featured: false }
    ];
    try {
      for (var i = 0; i < seedData.length; i++) {
        await addDoc(collection(db, 'team_members'), seedData[i]);
      }
      console.log('[seed] Auto-seeded 6 team members into Firestore.');
      await loadCmsCollection('team_members');
    } catch (e) {
      console.warn('[seed] Auto-seed team_members failed:', e.message);
    }
  }
  if (name === 'services' && window.cmsState[name].items.length === 0) {
    const seedData = [
      { title: "Pressure Vessels & Heat Exchangers", slug: "pressure-vessels-heat-exchangers", category: "Pressure & Heat Transfer", summary: "ASME and IBR-compliant pressure vessels, shell & tube and plate heat exchangers, calandrias, and calciners engineered for demanding process conditions.", description: "ASME and IBR-compliant pressure vessels, shell & tube and plate heat exchangers, calandrias, and calciners engineered for demanding process conditions.", image: "img/manufacturing/service-pressure-vessel.jpg", features: [], is_featured: true, order: 1 },
      { title: "Industrial Drying & Heating Systems", slug: "industrial-drying-heating-systems", category: "Drying & Heating", summary: "Rotary, paddle, sludge, spray, and drum dryers plus air pre-heaters and evaporation systems for efficient solid and thermal processing.", description: "Rotary, paddle, sludge, spray, and drum dryers plus air pre-heaters and evaporation systems for efficient solid and thermal processing.", image: "img/manufacturing/service-dryer.jpg", features: [], is_featured: true, order: 2 },
      { title: "Reactors, Columns & Storage Tanks", slug: "reactors-columns-storage-tanks", category: "Reactors & Columns", summary: "Custom reactors, distillation columns, cladded vessels, and storage tanks fabricated in SS, duplex, and exotic alloys for chemical and pharma processes.", description: "Custom reactors, distillation columns, cladded vessels, and storage tanks fabricated in SS, duplex, and exotic alloys for chemical and pharma processes.", image: "img/manufacturing/service-reactor.jpg", features: [], is_featured: true, order: 3 },
      { title: "Skid Packages & Process Piping", slug: "skid-packages-process-piping", category: "Modular Systems", summary: "Pre-engineered modular skids, process and pressure piping, sterile piping, and structural engineering for fast-track plant installations.", description: "Pre-engineered modular skids, process and pressure piping, sterile piping, and structural engineering for fast-track plant installations.", image: "img/manufacturing/service-skid.jpg", features: [], is_featured: false, order: 4 },
      { title: "Turnkey Project Execution", slug: "turnkey-project-execution", category: "Turnkey Projects", summary: "End-to-end project delivery covering design, manufacturing, supply, erection, and commissioning for large-scale industrial installations.", description: "End-to-end project delivery covering design, manufacturing, supply, erection, and commissioning for large-scale industrial installations.", image: "img/manufacturing/service-heat-exchanger.jpg", features: [], is_featured: true, order: 5 },
      { title: "Maintenance & Revamping", slug: "maintenance-revamping", category: "Maintenance", summary: "Annual maintenance contracts, plant shutdowns, relocations, and revamping services that keep your facility running at peak efficiency.", description: "Annual maintenance contracts, plant shutdowns, relocations, and revamping services that keep your facility running at peak efficiency.", image: "img/manufacturing/service-maintenance.jpg", features: [], is_featured: false, order: 6 }
    ];
    try {
      for (var i = 0; i < seedData.length; i++) {
        await addDoc(collection(db, 'services'), seedData[i]);
      }
      console.log('[seed] Auto-seeded 6 services into Firestore.');
      await loadCmsCollection('services');
    } catch (e) {
      console.warn('[seed] Auto-seed services failed (you may need to log in as admin):', e.message);
    }
  }
  if (name === 'projects' && window.cmsState[name].items.length === 0) {
    var projects = [
      { title: "Metal Production", slug: "metal-production", category: "Process Equipment", client: "", location: "", year: "", summary: "Complete process equipment installation for metal production facility.", description: "Design, fabrication, and installation of process equipment including pressure vessels, heat exchangers, and piping systems for a metal production facility.", image: "67512b0c631970a86b689e0a/6763e5627b847d57c22393c0_project-img-01.jpg", gallery: [], is_featured: true, order: 1 },
      { title: "Manufacturing", slug: "manufacturing", category: "Heavy Fabrication", client: "", location: "", year: "", summary: "Heavy fabrication project for industrial manufacturing facility.", description: "Heavy fabrication and assembly of structural and process components for an industrial manufacturing facility.", image: "67512b0c631970a86b689e0a/6763e57182f8fe13c7d4bbd8_project-img-02.jpg", gallery: [], is_featured: true, order: 2 },
      { title: "Energy Power Project", slug: "energy-power-project", category: "Thermal Systems", client: "", location: "", year: "", summary: "Thermal systems design and installation for power generation.", description: "Engineering and execution of thermal systems including boilers, heat exchangers, and piping for a power generation project.", image: "67512b0c631970a86b689e0a/6763e581b78254d8de5d2c74_project-img-03.jpg", gallery: [], is_featured: true, order: 3 },
      { title: "Factory Remodeling", slug: "factory-remodeling", category: "Modular Skids", client: "", location: "", year: "", summary: "Modular skid packages for factory remodeling project.", description: "Design and supply of pre-engineered modular skid packages for a factory remodeling project.", image: "67512b0c631970a86b689e0a/6763e58f9cd0a3e0d991fbda_project-img-04.jpg", gallery: [], is_featured: false, order: 4 },
      { title: "Warehouse Support", slug: "warehouse-support", category: "Project Execution", client: "", location: "", year: "", summary: "Structural and process support systems for warehouse facility.", description: "Complete project execution including structural engineering, process piping, and equipment installation for a warehouse support facility.", image: "67512b0c631970a86b689e0a/6760f71bd10487514f7e6d11_port-08.jpg", gallery: [], is_featured: false, order: 5 },
      { title: "Finishing & Coating", slug: "finishing-coating", category: "Drying & Solid Processing", client: "", location: "", year: "", summary: "Drying and coating systems for finishing line.", description: "Engineering and supply of drying and coating equipment for an industrial finishing and coating line.", image: "67512b0c631970a86b689e0a/6763e5baf5e766a22f5b0b39_project-img-07.jpg", gallery: [], is_featured: false, order: 6 },
      { title: "Chemical Refinery", slug: "chemical-refinery", category: "Process Equipment", client: "", location: "", year: "", summary: "Process equipment for chemical refinery operations.", description: "Design, fabrication, and installation of process equipment for a chemical refinery.", image: "67512b0c631970a86b689e0a/6763e5ae545d4034af000de4_project-img-06.jpg", gallery: [], is_featured: true, order: 7 },
      { title: "Thermal Processing", slug: "thermal-processing", category: "Thermal Systems", client: "", location: "", year: "", summary: "Thermal processing systems for industrial applications.", description: "Engineering and execution of thermal processing systems including furnaces, ovens, and heat treatment equipment.", image: "67512b0c631970a86b689e0a/6763e59da0e4de8b4c4cfc9d_project-img-05.jpg", gallery: [], is_featured: false, order: 8 },
      { title: "VA Tech Wabag -- Process Skids", slug: "va-tech-wabag-process-skids", category: "Oil & Gas / Desalination", client: "VA Tech Wabag", location: "", year: "", summary: "16 process skids with piping, valves & instruments, 20,000 inch-dia process piping, 8 storage tanks and 100 SS piping spools.", description: "Design, fabrication, and supply of 16 process skids with complete piping, valves, and instruments for a desalination project.", image: "67512b0c631970a86b689e0a/6763dc88e56d6870c57c4559_project-img-001.jpg", gallery: [], is_featured: true, order: 9 },
      { title: "Thermax -- 300 TPH Boiler Project", slug: "thermax-300-tph-boiler-project", category: "Power", client: "Thermax", location: "Mithapur", year: "", summary: "4 pressure sand filter vessels & 4 activated carbon filter vessels for the 300 TPH boiler & turbine generator project at Mithapur.", description: "Fabrication and supply of 4 pressure sand filter vessels and 4 activated carbon filter vessels for the 300 TPH boiler and turbine generator project at Mithapur.", image: "67512b0c631970a86b689e0a/6763dc94a00cc2543f78e360_project-img-002.jpg", gallery: [], is_featured: true, order: 10 },
      { title: "Olon API India -- SS316L Reactors", slug: "olon-api-india-ss316l-reactors", category: "Pharmaceutical", client: "Olon API India", location: "Mahad", year: "", summary: "2KL, 4KL & 6KL SS316L reactors with interconnecting site piping at Mahad.", description: "Design, fabrication, and installation of 2KL, 4KL, and 6KL SS316L reactors with interconnecting site piping for pharmaceutical manufacturing at Mahad.", image: "67512b0c631970a86b689e0a/6763dcb19c81e80aad55612b_project-img-003.jpg", gallery: [], is_featured: true, order: 11 }
    ];
    try {
      for (var i = 0; i < projects.length; i++) {
        await addDoc(collection(db, 'projects'), projects[i]);
      }
      console.log('[seed] Auto-seeded 11 projects into Firestore.');
      await loadCmsCollection('projects');
    } catch (e) {
      console.warn('[seed] Auto-seed projects failed:', e.message);
    }
  }
  if (name === 'testimonials' && window.cmsState[name].items.length === 0) {
    var testimonials = [
      { author_name: "Rajesh Menon", author_role: "Plant Head, Chemicals", author_company: "", author_image: "67512b0c631970a86b689dc8/avatar-anonymous.svg", body: "HI-NOVA APEX delivered our paddle dryer system on schedule and to exact specification. Their engineering team understood our process requirements and the build quality was excellent.", rating: 5, is_featured: true, order: 1 },
      { author_name: "Anita Deshpande", author_role: "Project Manager, Pharma", author_company: "", author_image: "67512b0c631970a86b689dc8/avatar-anonymous.svg", body: "We trusted HI-NOVA with SS316L reactors for a pharmaceutical project. The fabrication, documentation, and IBR compliance were handled professionally from start to commissioning.", rating: 5, is_featured: true, order: 2 },
      { author_name: "Sanjay Kulkarni", author_role: "Engineering Lead, Refinery", author_company: "", author_image: "67512b0c631970a86b689dc8/avatar-anonymous.svg", body: "From heat exchangers to skid-mounted piping, HI-NOVA APEX has been a dependable partner for our refinery projects. Their turnkey execution saved us significant downtime.", rating: 5, is_featured: true, order: 3 }
    ];
    try {
      for (var i = 0; i < testimonials.length; i++) {
        await addDoc(collection(db, 'testimonials'), testimonials[i]);
      }
      console.log('[seed] Auto-seeded 3 testimonials into Firestore.');
      await loadCmsCollection('testimonials');
    } catch (e) {
      console.warn('[seed] Auto-seed testimonials failed:', e.message);
    }
  }
  if (name === 'industries' && window.cmsState[name].items.length === 0) {
    var industries = [
      { title: "Oil & Gas", description: "Pressure vessels, heat exchangers, and process piping for upstream, midstream, and downstream operations", image: "https://images.unsplash.com/photo-1578356058390-f58c575337a2?w=400&h=250&fit=crop&auto=format", alt_text: "Oil and Gas Industry", order: 1, is_active: true },
      { title: "Petrochemical", description: "Reactors, columns, and thermal systems for petrochemical processing plants", image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=400&h=250&fit=crop&auto=format", alt_text: "Petrochemical Plant", order: 2, is_active: true },
      { title: "Chemical", description: "Custom-fabricated reactors, storage tanks, and skid packages for chemical manufacturing", image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=250&fit=crop&auto=format", alt_text: "Chemical Industry", order: 3, is_active: true },
      { title: "Fertilizer", description: "Drying systems, evaporators, and heavy fabrication for fertilizer production lines", image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=250&fit=crop&auto=format", alt_text: "Fertilizer Industry", order: 4, is_active: true },
      { title: "Refinery", description: "Heat exchangers, columns, and turnkey solutions for refinery operations", image: "https://images.unsplash.com/photo-1768564206500-5cddb1fea679?w=400&h=250&fit=crop&auto=format", alt_text: "Refinery Operations", order: 5, is_active: true },
      { title: "Pharmaceutical", description: "SS316L reactors, sterile piping, and IBR-compliant equipment for pharma processes", image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=250&fit=crop&auto=format", alt_text: "Pharmaceutical Industry", order: 6, is_active: true },
      { title: "Food Processing", description: "Hygienic process equipment, mixers, and storage systems for food-grade applications", image: "https://images.unsplash.com/photo-1661956660871-2cd646709c90?w=400&h=250&fit=crop&auto=format", alt_text: "Food Processing Industry", order: 7, is_active: true },
      { title: "Dairy", description: "Pasteurization systems, storage tanks, and sanitary piping for dairy operations", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=250&fit=crop&auto=format", alt_text: "Dairy Industry", order: 8, is_active: true },
      { title: "Brewery", description: "Fermentation vessels, heat exchangers, and process skids for brewing facilities", image: "https://images.unsplash.com/photo-1651171052773-1f46b5894d6a?w=400&h=250&fit=crop&auto=format", alt_text: "Brewery Industry", order: 9, is_active: true },
      { title: "Power Generation", description: "Boilers, heat recovery systems, and pressure parts for power plants", image: "https://images.unsplash.com/photo-1509390288171-ce2088f7d08e?w=400&h=250&fit=crop&auto=format", alt_text: "Power Generation", order: 10, is_active: true },
      { title: "Desalination", description: "Thermal desalination equipment, evaporators, and heat transfer systems", image: "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?w=400&h=250&fit=crop&auto=format", alt_text: "Desalination Plant", order: 11, is_active: true },
      { title: "Distillery & Ethanol", description: "Fermentation tanks, distillation columns, and drying systems for ethanol plants", image: "https://images.unsplash.com/photo-1534655882117-f9eff36a1574?w=400&h=250&fit=crop&auto=format", alt_text: "Distillery and Ethanol", order: 12, is_active: true },
      { title: "Marine & Offshore", description: "Corrosion-resistant process equipment and heavy fabrication for marine environments", image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&h=250&fit=crop&auto=format", alt_text: "Marine and Offshore", order: 13, is_active: true },
      { title: "Defence", description: "Precision-engineered equipment and fabrication meeting defence-grade specifications", image: "https://images.unsplash.com/photo-1508530786855-dfea35260b8d?w=400&h=250&fit=crop&auto=format", alt_text: "Defence Industry", order: 14, is_active: true },
      { title: "Renewable Energy", description: "Process equipment for solar thermal, biomass, and green energy applications", image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop&auto=format", alt_text: "Renewable Energy", order: 15, is_active: true },
      { title: "Hydrogen & Green Fuels", description: "Electrolyzer skids, reformers, and storage systems for hydrogen production", image: "https://images.unsplash.com/photo-1548337138-e87d889cc369?w=400&h=250&fit=crop&auto=format", alt_text: "Hydrogen and Green Fuels", order: 16, is_active: true },
      { title: "Edible Oil", description: "Refining equipment, heat exchangers, and storage tanks for edible oil processing", image: "https://images.unsplash.com/photo-1552592074-ea7a91b851b3?w=400&h=250&fit=crop&auto=format", alt_text: "Edible Oil Industry", order: 17, is_active: true },
      { title: "Agriculture", description: "Drying systems, storage silos, and process equipment for agricultural processing", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop&auto=format", alt_text: "Agriculture Industry", order: 18, is_active: true },
      { title: "Steel & Power Generation", description: "Heavy fabrication, heat treatment furnaces, and structural components for steel plants", image: "https://images.unsplash.com/photo-1496247749665-49cf5b1022e9?w=400&h=250&fit=crop&auto=format", alt_text: "Steel and Power Generation", order: 19, is_active: true },
      { title: "Pulp & Paper", description: "Digesters, dryers, and process vessels for pulp and paper manufacturing", image: "https://images.unsplash.com/photo-1682147382418-ddf8c3e1310e?w=400&h=250&fit=crop&auto=format", alt_text: "Pulp and Paper Industry", order: 20, is_active: true },
      { title: "Paint & Coatings", description: "Mixing vessels, reactors, and storage systems for paint and coatings production", image: "https://images.unsplash.com/photo-1456086272160-b28b0645b729?w=400&h=250&fit=crop&auto=format", alt_text: "Paint and Coatings", order: 21, is_active: true },
      { title: "Polymers & Resins", description: "Reactors, extrusion equipment, and thermal systems for polymer processing", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop&auto=format", alt_text: "Polymers and Resins", order: 22, is_active: true },
      { title: "Sugar", description: "Evaporators, crystallizers, and heavy fabrication for sugar mills", image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=250&fit=crop&auto=format", alt_text: "Sugar Industry", order: 23, is_active: true },
      { title: "Cement", description: "Heat exchangers, kiln components, and process equipment for cement plants", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=250&fit=crop&auto=format", alt_text: "Cement Industry", order: 24, is_active: true },
      { title: "Textile", description: "Dyeing vessels, drying systems, and process piping for textile manufacturing", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=250&fit=crop&auto=format", alt_text: "Textile Industry", order: 25, is_active: true },
      { title: "ETP, STP & Wastewater Treatment", description: "Treatment tanks, filtration systems, and process equipment for water treatment", image: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&h=250&fit=crop&auto=format", alt_text: "Wastewater Treatment", order: 26, is_active: true },
      { title: "Mining", description: "Heavy-duty process equipment, crushers, and structural fabrication for mining operations", image: "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=400&h=250&fit=crop&auto=format", alt_text: "Mining Industry", order: 27, is_active: true }
    ];
    try {
      for (var i = 0; i < industries.length; i++) {
        await addDoc(collection(db, 'industries'), industries[i]);
      }
      console.log('[seed] Auto-seeded 27 industries into Firestore.');
      await loadCmsCollection('industries');
    } catch (e) {
      console.warn('[seed] Auto-seed industries failed:', e.message);
    }
  }
}

async function saveCmsItem(collectionName, id, data) {
  if (id) {
    // Update existing
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
  } else {
    // Create new
    await addDoc(collection(db, collectionName), data);
  }
}

async function deleteCmsItem(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
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
function renderCmsListPage(collectionName, _retries) {
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

  // Auto-seed if collection is empty
  if (items.length === 0 && !_retries) {
    autoSeedCollection(collectionName).then(function () {
      var el = document.getElementById('admin-content');
      if (el) el.innerHTML = renderCmsListPage(collectionName, true);
    });
    return '<div class="page-header"><h2 class="page-heading">' + esc(def.label) + '</h2></div>' +
      '<div class="card"><div class="card-body">Seeding initial data from frontend...</div></div>';
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
        if (c.render) {
          // Custom render returns HTML — don't escape
          html += '<td>' + c.render(it) + '</td>';
        } else {
          const val = it[c.key] != null ? it[c.key] : '—';
          const display = (typeof val === 'string' || typeof val === 'number') ? String(val) : '—';
          html += '<td>' + esc(display) + '</td>';
        }
      });
      html += '<td class="actions-col">' +
        '<button class="btn btn-icon btn-sm" data-edit-cms="' + collectionName + '" data-cms-id="' + esc(it._id) + '" title="Edit">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
        '</button>' +
        '<button class="btn btn-icon btn-sm btn-icon-danger" data-delete-cms="' + collectionName + '" data-cms-id="' + esc(it._id) + '" title="Delete">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>' +
        '</button>' +
      '</td>';
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
window.CMS = {
  collections: CMS_COLLECTIONS,
  loadCollection: loadCmsCollection,
  renderList: renderCmsListPage,
  renderEditor: renderCmsEditorPage,
  saveItem: saveCmsItem,
  deleteItem: deleteCmsItem,
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
          // Update View Site link to point to the correct public page
          var viewSiteLink = document.querySelector('.btn-view-site');
          if (viewSiteLink && CMS_COLLECTIONS[name].viewUrl) {
            viewSiteLink.href = CMS_COLLECTIONS[name].viewUrl;
          }
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
