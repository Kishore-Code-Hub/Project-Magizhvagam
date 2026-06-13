async function fetchDiagnostics() {
  const out = document.getElementById('diag-output');
  out.textContent = 'Loading...';
  try {
    const res = await fetch('/api/admin/system/smtp-test', { credentials: 'include' });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    out.textContent = 'Error: ' + (e.message || e);
  }
}

async function sendTest() {
  const recipient = document.getElementById('test-recipient').value || '';
  const out = document.getElementById('send-output');
  out.textContent = 'Sending...';
  try {
    const res = await fetch('/api/admin/system/smtp-send-test', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: recipient })
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    out.textContent = 'Error: ' + (e.message || e);
  }
}

document.getElementById('refresh-diag').addEventListener('click', fetchDiagnostics);
document.getElementById('send-test').addEventListener('click', sendTest);
// Auto-load
fetchDiagnostics();