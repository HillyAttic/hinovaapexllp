// API Configuration - points to the server-side Worker (which holds the Firebase secret).
// No Firebase credentials live in the browser. Update the URL after deploying the Worker,
// or override per-page via <meta name="api-base" content="https://your-worker-url">.
var API_BASE = document.querySelector('meta[name="api-base"]')?.content || 'https://hinovaapexllp-worker.your-subdomain.workers.dev';
