const fs = require('fs');

const raw = fs.readFileSync('report/results.json', 'utf8');
const data = JSON.parse(raw);

const executions = data.run.executions;
const timestamp = new Date().toUTCString();

const rows = executions.map(exec => {
  const name = exec.item.name;
  const responseCode = exec.response ? exec.response.code : null;
  const responseTime = exec.response ? exec.response.responseTime : null;
  const failedAssertions = exec.assertions
    ? exec.assertions.filter(a => a.error)
    : [];
  const passed = responseCode === 200 && failedAssertions.length === 0;

  return { name, responseCode, responseTime, passed, failedAssertions };
});

const totalPassed = rows.filter(r => r.passed).length;
const totalFailed = rows.filter(r => !r.passed).length;

const tableRows = rows.map(r => `
  <tr>
    <td>${r.passed ? '✅' : '❌'}</td>
    <td>${r.name}</td>
    <td class="${r.responseCode === 200 ? 'ok' : 'fail'}">${r.responseCode ?? 'No response'}</td>
    <td>${r.responseTime != null ? r.responseTime + ' ms' : '—'}</td>
    <td>${r.failedAssertions.length === 0
      ? '<span class="ok">All passed</span>'
      : r.failedAssertions.map(a => `<span class="fail">${a.error.message}</span>`).join('<br>')
    }</td>
  </tr>
`).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>QA Health Check</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f1117;
      color: #e0e0e0;
      padding: 40px 24px;
    }
    .container { max-width: 860px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .timestamp { font-size: 13px; color: #888; margin-bottom: 32px; }
    .stats {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat {
      flex: 1;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
    }
    .stat.passed { background: #0d2b1e; border: 1px solid #1a5c3a; }
    .stat.failed { background: #2b0d0d; border: 1px solid #5c1a1a; }
    .stat .number { font-size: 40px; font-weight: 800; }
    .stat.passed .number { color: #4ade80; }
    .stat.failed .number { color: #f87171; }
    .stat .label { font-size: 13px; color: #888; margin-top: 4px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-bottom: 32px;
    }
    thead tr {
      background: #1e2130;
      color: #888;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #1e2130;
    }
    tbody tr:hover { background: #1a1d27; }
    .ok { color: #4ade80; }
    .fail { color: #f87171; }
    .full-report {
      display: inline-block;
      margin-top: 8px;
      padding: 10px 24px;
      background: #2563eb;
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
    }
    .full-report:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🩺 QA Health Check</h1>
    <p class="timestamp">Last run: ${timestamp}</p>

    <div class="stats">
      <div class="stat passed">
        <div class="number">${totalPassed}</div>
        <div class="label">Services OK</div>
      </div>
      <div class="stat failed">
        <div class="number">${totalFailed}</div>
        <div class="label">Services Failed</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th></th>
          <th>Service</th>
          <th>Status</th>
          <th>Response Time</th>
          <th>Assertions</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <a href="report.html" class="full-report">View Full Report →</a>
  </div>
</body>
</html>`;

fs.writeFileSync('report/index.html', html);
console.log('Summary page generated: report/index.html');
