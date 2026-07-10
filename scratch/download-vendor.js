/**
 * MAGIZHVAGAM — Download Vendor Scripts
 * Downloads GSAP, GSAP ScrollTrigger, and Lenis to self-host them in /assets/vendor/
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const VENDOR_DIR = path.join(__dirname, '..', 'assets', 'vendor');

// Ensure vendor directory exists
if (!fs.existsSync(VENDOR_DIR)) {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
  console.log(`Created directory: ${VENDOR_DIR}`);
}

const FILES = [
  {
    name: 'gsap.min.js',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'
  },
  {
    name: 'ScrollTrigger.min.js',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'
  },
  {
    name: 'lenis.min.js',
    url: 'https://cdn.jsdelivr.net/npm/lenis@1.1.5/dist/lenis.min.js'
  },
  {
    name: 'qrious.min.js',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'
  }
];

function downloadFile(fileUrl, outputPath) {
  return new Promise((resolve, reject) => {
    https.get(fileUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        downloadFile(res.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${fileUrl}: HTTP ${res.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Successfully downloaded: ${path.basename(outputPath)}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function start() {
  console.log('Downloading vendor scripts for self-hosting...');
  for (const f of FILES) {
    const dest = path.join(VENDOR_DIR, f.name);
    try {
      await downloadFile(f.url, dest);
    } catch (err) {
      console.error(`Error downloading ${f.name}:`, err.message);
      process.exit(1);
    }
  }
  console.log('All vendor scripts successfully downloaded.');
}

start();
