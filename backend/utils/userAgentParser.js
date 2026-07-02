function parseUserAgent(ua) {
  if (!ua) {
    return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' };
  }

  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  let device = 'Desktop';
  if (/mobile/i.test(ua)) device = 'Mobile';
  if (/ipad|tablet/i.test(ua)) device = 'Tablet';

  return { browser, os, device };
}

module.exports = { parseUserAgent };
