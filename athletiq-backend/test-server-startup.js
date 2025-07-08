// Simple server test to check if the backend can start
const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Starting backend server test...');

const serverPath = path.join(__dirname, 'server.js');
console.log('Server path:', serverPath);

const server = spawn('node', [serverPath], {
  cwd: __dirname,
  stdio: 'pipe',
  env: process.env
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('📄 STDOUT:', text.trim());
});

server.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  console.log('❌ STDERR:', text.trim());
});

server.on('error', (error) => {
  console.log('💥 Server process error:', error.message);
});

server.on('exit', (code, signal) => {
  console.log(`🔚 Server process exited with code ${code} and signal ${signal}`);
  if (code !== 0) {
    console.log('❌ Server failed to start');
    console.log('Output:', output);
    console.log('Error:', errorOutput);
  }
});

// Give the server 5 seconds to start
setTimeout(() => {
  console.log('⏰ 5 seconds elapsed, checking server status...');
  if (output.includes('Server started')) {
    console.log('✅ Server appears to be running');
    server.kill();
  } else {
    console.log('❌ Server does not appear to be running');
    console.log('Full output:', output);
    console.log('Full error:', errorOutput);
    server.kill();
  }
}, 5000);
