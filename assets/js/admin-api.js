/**
 * Admin API helper — always sends session cookies for protected routes.
 */
window.adminFetch = (url, options = {}) => {
  const opts = { ...options, credentials: 'same-origin' };
  if (opts.body && !(opts.body instanceof FormData) && !opts.headers) {
    opts.headers = { 'Content-Type': 'application/json' };
  } else if (opts.body && !(opts.body instanceof FormData) && opts.headers && !opts.headers['Content-Type'] && typeof opts.body === 'string') {
    opts.headers = { ...opts.headers, 'Content-Type': 'application/json' };
  }
  return fetch(url, opts);
};
