const http = require('http');

function testLogin(username, password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ username, password });
    const req = http.request({
      host: '127.0.0.1',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Login [${username}]: status ${res.statusCode} ->`, body);
        resolve();
      });
    });
    req.on('error', (e) => {
      console.error(`Login [${username}] error:`, e.message);
      resolve();
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  await testLogin('admin', 'Admin@123456');
  await testLogin('doctor', 'Doctor@123456');
  await testLogin('reception', 'Reception@123456');
}

run();

