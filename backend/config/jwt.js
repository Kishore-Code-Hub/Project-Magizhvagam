/**
 * Centralized JWT secret resolution.
 * Production requires explicit env vars; development allows documented fallbacks.
 */
function getJwtSecrets() {
  const access = process.env.JWT_ACCESS_SECRET;
  const refresh = process.env.JWT_REFRESH_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!access || !refresh) {
      throw new Error(
        'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set when NODE_ENV=production'
      );
    }
    return { access, refresh };
  }

  return {
    access: access || 'magizhvagam_super_secure_access_secret_123!@#',
    refresh: refresh || 'magizhvagam_super_secure_refresh_secret_456!@#'
  };
}

const { access: JWT_ACCESS_SECRET, refresh: JWT_REFRESH_SECRET } = getJwtSecrets();

module.exports = {
  getJwtSecrets,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET
};
