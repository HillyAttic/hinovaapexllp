// HI-NOVA APEX Public Loader — Project Detail Page
// Populates project detail pages with live data from Firestore.
//
// Usage: include this script at the end of the body in project/*.html pages.
// The script reads the slug from the URL or data attribute and loads the matching project.
// If Firestore is unreachable, the static template renders as-is (graceful fallback).

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getProjectSlug() {
    // Try to get slug from data attribute first
    var html = document.documentElement;
    var slug = html.getAttribute('data-wf-item-slug');
    if (slug) return slug;

    // Try to get from URL path
    var path = window.location.pathname;
    var match = path.match(/\/project\/([^\/]+)\.html$/);
    if (match) return match[1];

    return null;
  }

  async function load() {
    var slug = getProjectSlug();
    if (!slug) return;

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

      // Query for project with matching slug
      var q = firestoreModule.query(
        firestoreModule.collection(db, 'projects'),
        firestoreModule.where('slug', '==', slug),
        firestoreModule.limit(1)
      );
      var snapshot = await firestoreModule.getDocs(q);

      if (snapshot.empty) {
        console.warn('[project-detail-loader] No project found with slug:', slug);
        return;
      }

      var project = snapshot.docs[0].data();

      // Update breadcrumb title
      var breadcrumbTitle = document.querySelector('.breadcrumb-title');
      if (breadcrumbTitle && project.title) {
        breadcrumbTitle.textContent = project.title;
      }

      // Update page title
      if (project.title) {
        document.title = project.title + ' | HI-NOVA APEX LLP';
      }

      // Update hero image
      var heroImage = document.querySelector('.project-details-preview');
      if (heroImage && project.hero_image) {
        heroImage.src = project.hero_image;
        heroImage.srcset = '';
        heroImage.alt = project.title || 'Project';
      } else if (heroImage && project.image) {
        // Fallback to cover image
        heroImage.src = project.image;
        heroImage.srcset = '';
        heroImage.alt = project.title || 'Project';
      }

      // Update metadata
      var metaDataElements = document.querySelectorAll('.portfolio-meta-data');
      if (metaDataElements.length >= 4) {
        // Client
        var clientValue = metaDataElements[0].querySelector('.portfolio-category');
        if (clientValue) {
          clientValue.textContent = project.client_name || project.client || '—';
        }

        // Category
        var categoryValue = metaDataElements[1].querySelector('.portfolio-category');
        if (categoryValue) {
          categoryValue.textContent = project.client_category || project.category || '—';
        }

        // Date
        var dateValue = metaDataElements[2].querySelector('.portfolio-category');
        if (dateValue) {
          dateValue.textContent = project.date || '—';
        }

        // Website
        var websiteValue = metaDataElements[3].querySelector('.portfolio-category');
        if (websiteValue) {
          websiteValue.textContent = project.website || '—';
        }
      }

      // Update content
      var contentArea = document.querySelector('.project-content .w-richtext');
      if (contentArea && project.content) {
        contentArea.innerHTML = project.content;
      }

      // Update client review
      var blockquote = document.querySelector('.project-content blockquote');
      if (blockquote && project.client_review) {
        blockquote.textContent = '"' + project.client_review + '"';
      }

      console.log('[project-detail-loader] Loaded project:', project.title);
    } catch (e) {
      console.warn('[project-detail-loader] Could not load CMS data, keeping static content:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
