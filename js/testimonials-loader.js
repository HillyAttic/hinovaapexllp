// HI-NOVA APEX Public Loader — Testimonials
// Replaces the hardcoded testimonial cards in the home page slider with live
// data from Firestore (via Firebase client SDK).
//
// Usage: include this script at the end of the body in index.html (and any
// other page that should show testimonials). If Firestore is unreachable, the
// static template renders as-is (graceful fallback).

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderCard(t) {
    var stars = '';
    var rating = Math.max(0, Math.min(5, Number(t.rating) || 5));
    for (var i = 0; i < rating; i++) stars += '★';
    var image = t.author_image || '67512b0c631970a86b689e0a/testimonial-01.jpg';
    var companyHtml = t.author_company ? ' · ' + esc(t.author_company) : '';
    return '<div class="testimonial-one-block w-dyn-item">' +
      '<div class="testimonial-one-content">' +
        '<div class="testimonial-quote-icon">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M14 17h3l2-4V7h-6v6h3M6 17h3l2-4V7H5v6h3l-2 4z"></path></svg>' +
        '</div>' +
        '<p class="testimonial-one-desc">' + esc(t.body || '') + '</p>' +
        '<div class="testimonial-rating">' + esc(stars) + '</div>' +
        '<div class="testimonial-author">' +
          '<img loading="lazy" alt="' + esc(t.author_name || 'Client') + '" src="' + esc(image) + '" class="testimonial-author-image">' +
          '<div>' +
            '<div class="testimonial-author-name">' + esc(t.author_name || '') + '</div>' +
            '<div class="testimonial-author-role">' + esc(t.author_role || '') + companyHtml + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  async function load() {
    var candidates = [
      document.querySelector('.testimonial-one-list'),
      document.querySelector('.testimonial-one-section .w-dyn-list'),
      document.querySelector('[data-cms="testimonials"]')
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
        firestoreModule.query(firestoreModule.collection(db, 'testimonials'), firestoreModule.orderBy('order', 'asc'))
      );
      var items = [];
      snapshot.forEach(function (doc) { items.push(doc.data()); });
      if (items.length === 0) return;
      var featured = items.filter(function (t) { return t.is_featured !== false; });
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
