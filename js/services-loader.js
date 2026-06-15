// HI-NOVA APEX Public Loader — Services
// Replaces the hardcoded service cards in services.html with live data from
// Firestore (via Firebase client SDK).
//
// Usage: include this script at the end of the body in services.html.
// It will:
//   1. Read all services from Firestore `services` collection
//   2. Find the .service-one-list (or .service-one-section .w-dyn-list) element
//   3. Replace its inner content with a fresh service card grid
//   4. If Firestore is unreachable, leave the static HTML in place (graceful fallback)

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderCard(s) {
    var image = s.image || '67512b0c631970a86b689e0a/service-01.jpg';
    var link = s.slug ? ('services/' + s.slug + '.html') : 'services.html';
    var features = Array.isArray(s.features) ? s.features : [];
    var featuresHtml = features.length > 0
      ? '<ul class="service-one-features">' + features.slice(0, 4).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>'
      : '';
    return '<div class="service-one-block w-dyn-item">' +
      '<a href="' + esc(link) + '" class="service-card-link w-inline-block">' +
        '<div class="service-one-image-wrap">' +
          '<img loading="lazy" alt="' + esc(s.title || 'Service') + '" src="' + esc(image) + '" class="service-one-image">' +
        '</div>' +
        '<div class="service-one-content">' +
          '<div class="category global-text">' + esc(s.category || 'Service') + '</div>' +
          '<h2 class="service-one-title">' + esc(s.title || '') + '</h2>' +
          '<p class="service-one-desc">' + esc(s.summary || s.description || '') + '</p>' +
          featuresHtml +
        '</div>' +
      '</a>' +
    '</div>';
  }

  async function load() {
    var candidates = [
      document.querySelector('.service-one-list'),
      document.querySelector('.service-one-section .w-dyn-list'),
      document.querySelector('[data-cms="services"]')
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
        firestoreModule.query(firestoreModule.collection(db, 'services'), firestoreModule.orderBy('order', 'asc'))
      );
      var items = [];
      snapshot.forEach(function (doc) { items.push(doc.data()); });
      if (items.length === 0) return;
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
