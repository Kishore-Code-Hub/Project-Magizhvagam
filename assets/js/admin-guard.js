/**
 * Blocks admin UI when opened via static file server (file:// or Live Server).
 * Real protection is server-side in adminPageRoutes + vercel.json routing.
 */
(function () {
  if (window.location.protocol === 'file:') {
    document.documentElement.innerHTML =
      '<body style="font-family:sans-serif;padding:40px;"><h1>Admin access denied</h1><p>Open the site with <code>npm start</code> and visit <a href="http://localhost:5000/admin/login">/admin/login</a>.</p></body>';
    throw new Error('Admin pages cannot run from file://');
  }
})();
