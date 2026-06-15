// HI-NOVA APEX Public Loader — Projects
// Replaces the hardcoded project cards in projects.html with live data from
// Firestore (via Firebase client SDK).
//
// Usage: include this script at the end of the body in projects.html.
// If Firestore is unreachable, the static template renders as-is (graceful fallback).

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderCard(p) {
    var image = p.image || '67512b0c631970a86b689e0a/project-img-001.jpg';
    var link = p.slug ? ('project/' + p.slug + '.html') : 'projects.html';
    var clientHtml = p.client
      ? '<div class="project-one-client">' + esc(p.client) + (p.year ? ' · ' + esc(p.year) : '') + '</div>'
      : '';
    return '<div class="project-one-block w-dyn-item">' +
      '<a href="' + esc(link) + '" class="project-card-link w-inline-block">' +
        '<div class="project-one-image-wrap">' +
          '<img loading="lazy" alt="' + esc(p.title || 'Project') + '" src="' + esc(image) + '" class="project-one-image">' +
        '</div>' +
        '<div class="project-one-content">' +
          '<div class="category global-text">' + esc(p.category || 'Project') + '</div>' +
          '<h2 class="project-one-title">' + esc(p.title || '') + '</h2>' +
          clientHtml +
          '<p class="project-one-desc">' + esc(p.summary || p.description || '') + '</p>' +
        '</div>' +
      '</a>' +
    '</div>';
  }

  async function load() {
    var candidates = [
      document.querySelector('.project-one-list'),
      document.querySelector('.project-one-section .w-dyn-list'),
      document.querySelector('[data-cms="projects"]')
    ];
    var list = candidates.find(Boolean);
    if (!list) return;
    try {
      var firebaseConfig = {
        apiKey: "AIzaSyDD3FYDDbJ6COQbB-y1uj88BUwnGwFTjy0",
        authDomain: "hinovaapex.firebaseapp.com",
        projectId: "hinovaapex",
        storageBucket: "hinovaapex.firebasestorage.app",
        messagingSenderId: "63355629880",
        appId: "1:63355629880:web:9ffbf16f77ca232cb211cd"
      };
      var appModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
      var firestoreModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      var app = appModule.getApps().length === 0
        ? appModule.initializeApp(firebaseConfig)
        : appModule.getApp();
      var db = firestoreModule.getFirestore(app);
      var snapshot = await firestoreModule.getDocs(
        firestoreModule.query(firestoreModule.collection(db, 'projects'), firestoreModule.orderBy('order', 'asc'))
      );
      var items = [];
      snapshot.forEach(function (doc) { items.push(doc.data()); });
      if (items.length === 0) return;
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
