const http = require('http');

http.get('http://localhost:5000/api/about-page', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', data);
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
