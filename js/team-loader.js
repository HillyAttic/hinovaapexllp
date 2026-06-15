// HI-NOVA APEX Public Loader — Team Members
// Replaces the hardcoded team grid in our-team.html with live data from
// Firestore (via Firebase client SDK).
//
// Usage: include this script at the end of the body in our-team.html.
// It will:
//   1. Read all team_members from Firestore
//   2. Find the <section class="team-one-section"> element
//   3. Replace its inner content with a fresh team grid
//   4. If Firestore is unreachable, leave the static HTML in place (graceful fallback)

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Render card for our-team.html (team-two style)
  function renderTeamTwoCard(m) {
    var image = m.image || '67512b0c631970a86b689e0a/team-anonymous.svg';
    var link = m.slug ? ('team/' + m.slug + '.html') : 'our-team.html';
    var linkedin = m.linkedin
      ? '<a href="' + esc(m.linkedin) + '" target="_blank" rel="noopener" class="team-one-social-link" aria-label="LinkedIn">' +
          '<svg viewBox="0 0 448 512" fill="currentColor" width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"></path></svg>' +
        '</a>'
      : '';
    return '<div role="listitem" class="team-two-item w-dyn-item">' +
      '<div data-w-id="f154001b-dbf5-8245-6de5-b51c3dc2b79e" class="team-two-link">' +
        '<div class="team-two-image-wrap">' +
          '<img alt="' + esc(m.name || 'Team') + '" loading="lazy" src="' + esc(image) + '" class="team-two-preview">' +
          '<div class="team-two-share-btn-wrap">' +
            '<div class="team-bottom-right-curve"></div>' +
            '<div class="team-bottom-left-curve"></div>' +
            '<div data-w-id="f154001b-dbf5-8245-6de5-b51c3dc2b7a4" class="team-one-btn">' +
              '<div class="team-two-btn-wrap">' +
                '<img width="Auto" loading="lazy" alt="" src="67512b0c631970a86b689dc8/67512b0c631970a86b689e75_share.svg" class="team-one-btn-image-2">' +
              '</div>' +
              '<div style="transform:translate3d(0,10px,0);opacity:0" class="team-one-social-links">' +
                '<ul role="list" class="team-two-social-link-ul">' +
                  '<li class="team-one-social-li third">' +
                    '<a href="#" class="team-one-social-link w-inline-block"><div class="meta-one-icons"><svg width="100%" height="100%" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg></div></a>' +
                  '</li>' +
                  '<li class="team-one-social-li second">' +
                    '<a href="#" class="team-one-social-link w-inline-block"><div class="meta-one-icons"><svg width="100%" height="100%" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path></svg></div></a>' +
                  '</li>' +
                  '<li class="team-one-social-li first">' +
                    '<a href="' + (m.linkedin || '#') + '" target="_blank" class="team-one-social-link w-inline-block"><div class="meta-one-icons"><svg width="100%" height="100%" viewBox="0 0 320 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path></svg></div></a>' +
                  '</li>' +
                '</ul>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="team-two-content">' +
          '<div class="category">' + esc(m.role || '') + '</div>' +
          '<a href="' + esc(link) + '" class="team-two-title">' + esc(m.name || '') + '</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // Render card for homepage Core Team section (team-one style)
  function renderTeamOneCard(m, index) {
    var image = m.image || '67512b0c631970a86b689e0a/team-anonymous.svg';
    var link = m.slug ? ('team/' + m.slug + '.html') : 'our-team.html';
    var num = String(index + 1).padStart(3, '0');
    return '<div role="listitem" class="team-one-item team-line w-dyn-item">' +
      '<a data-w-id="f5ef3ccf-788e-5d1e-9638-d8e7c3378b6c" href="' + esc(link) + '" class="team-one-link w-inline-block">' +
        '<div class="team-one-content">' +
          '<div class="team-one-number">' + num + '</div>' +
          '<div data-w-id="f5ef3ccf-788e-5d1e-9638-d8e7c3378b6f" class="team-one-title" style="color: rgb(21, 20, 28);">' + esc(m.name || '') + '</div>' +
          '<div class="team-one-designation-wrap">' +
            '<div class="team-one-slash">/</div>' +
            '<div class="category">' + esc(m.role || '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div data-w-id="f5ef3ccf-788e-5d1e-9638-d8e7c3378b74" class="team-one-image-wrap" style="transform: translate3d(0px, -30%, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg); transform-style: preserve-3d; opacity: 0;">' +
          '<img alt="Team" loading="lazy" src="' + esc(image) + '" class="team-one-preview">' +
        '</div>' +
        '<div class="team-one-btn">' +
          '<div data-w-id="62829347-029c-869a-aefc-44a52801c4c7" class="team-one-btn-wrap" style="transform: translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg); transform-style: preserve-3d;">' +
            '<img width="Auto" loading="lazy" alt="Icon 4" src="67512b0c631970a86b689dc8/6768f88d2837d8afcf890c58_arrow-right-global.svg" class="team-right-bottom-shape-arrow">' +
            '<div class="team-one-btn-text">Read More</div>' +
          '</div>' +
          '<img width="Auto" loading="lazy" alt="Icon 4" src="67512b0c631970a86b689dc8/6768f88d2837d8afcf890c58_arrow-right-global.svg" class="team-right-bottom-shape-arrow-hover" style="transform: translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg); transform-style: preserve-3d;">' +
        '</div>' +
      '</a>' +
    '</div>';
  }

  async function load() {
    // Detect which page we're on
    var isHomePage = document.querySelector('.team-one-section');
    var isTeamPage = document.querySelector('.team-two-wrap');
    if (!isHomePage && !isTeamPage) return;

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
        firestoreModule.query(firestoreModule.collection(db, 'team_members'), firestoreModule.orderBy('order', 'asc'))
      );
      var items = [];
      snapshot.forEach(function (doc) { items.push(doc.data()); });
      if (items.length === 0) return;

      if (isHomePage) {
        // Homepage Core Team: show only featured members
        var active = items.filter(function (m) {
          return m.is_active !== false && m.is_featured === true;
        });
        if (active.length === 0) return;
        var list = document.querySelector('.team-one-list');
        if (list) list.innerHTML = active.map(function (m, i) { return renderTeamOneCard(m, i); }).join('');
      } else if (isTeamPage) {
        // Our Team page: show all active members
        var active = items.filter(function (m) { return m.is_active !== false; });
        if (active.length === 0) return;
        var list = document.querySelector('.team-two-list');
        if (list) list.innerHTML = active.map(function (m) { return renderTeamTwoCard(m); }).join('');
      }
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
