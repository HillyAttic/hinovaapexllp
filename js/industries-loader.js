// HI-NOVA APEX Public Loader — Industries
// Replaces the hardcoded industry cards in industries.html with live data from
// Firestore (via Firebase client SDK).
//
// Usage: include this script at the end of the body in industries.html, after
// the Firebase SDK scripts and firebase-config.js.
// It will:
//   1. Read all industries from Firestore `industries` collection
//   2. Filter active items and sort by `order`
//   3. Find the .industries-grid element and replace its inner content
//   4. If Firestore is unreachable, leave the static HTML in place (graceful fallback)

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
      // Use Firebase client SDK directly (same as admin panel)
      var firebaseConfig = {
        apiKey: "AIzaSyDD3FYDDbJ6COQbB-y1uj88BUwnGwFTjy0",
        authDomain: "hinovaapex.firebaseapp.com",
        projectId: "hinovaapex",
        storageBucket: "hinovaapex.firebasestorage.app",
        messagingSenderId: "63355629880",
        appId: "1:63355629880:web:9ffbf16f77ca232cb211cd",
        measurementId: "G-JJ886Q8NTR"
      };

      // Dynamic import of Firebase SDK
      var appModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
      var firestoreModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

      var app = appModule.getApps().length === 0
        ? appModule.initializeApp(firebaseConfig)
        : appModule.getApp();
      var db = firestoreModule.getFirestore(app);

      var snapshot = await firestoreModule.getDocs(
        firestoreModule.query(
          firestoreModule.collection(db, 'industries'),
          firestoreModule.orderBy('order', 'asc')
        )
      );

      var items = [];
      snapshot.forEach(function (doc) { items.push(doc.data()); });
      if (items.length === 0) return;

      // Filter active items
      var active = items.filter(function (item) { return item.is_active !== false; });
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
