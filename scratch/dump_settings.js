const http = require('http');

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const siteSettings = await getJSON('http://localhost:5000/api/site-settings/homepage');
    console.log('--- SITE-SETTINGS HOMEPAGE ---');
    console.log(JSON.stringify(siteSettings, null, 2));

    const settings = await getJSON('http://localhost:5000/api/settings/homepage');
    console.log('\n--- SETTINGS HOMEPAGE ---');
    console.log(JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error(err);
  }
}

main();
