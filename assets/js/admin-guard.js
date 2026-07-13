/**
 * Blocks admin UI when opened via static file server (file:// or Live Server).
 * Real protection is server-side in adminPageRoutes + vercel.json routing.
 */
(function () {
  if (window.location.protocol === 'file:') {
    document.documentElement.innerHTML =
      '<body style="font-family:sans-serif;padding:40px;"><h1>Admin access denied</h1><p>Start the server with <code>npm start</code> and navigate to the admin login page.</p></body>';
    throw new Error('Admin pages cannot run from file://');
  }

  if (localStorage.getItem("adminAuth") !== "true") {
    window.location.href = "/admin/login";
  }
})();
