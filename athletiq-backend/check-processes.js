// Script to check and manage Node.js processes
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('🔍 Checking for running Node.js processes...');

async function checkProcesses() {
  try {
    // Check for Node processes on Windows
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
    const lines = stdout.split('\n').filter(line => line.includes('node.exe'));
    
    if (lines.length > 0) {
      console.log(`Found ${lines.length} Node.js processes:`);
      lines.forEach((line, index) => {
        console.log(`${index + 1}. ${line}`);
      });
      
      console.log('\n💡 Multiple Node processes might be causing conflicts.');
      console.log('🔧 To kill all Node processes, run: taskkill /F /IM node.exe');
    } else {
      console.log('✅ No Node.js processes found running');
    }
  } catch (error) {
    console.log('❌ Error checking processes:', error.message);
  }
  
  // Check what's using port 5000
  console.log('\n🔍 Checking what\'s using port 5000...');
  try {
    const { stdout } = await execAsync('netstat -ano | findstr :5000');
    if (stdout.trim()) {
      console.log('Port 5000 usage:');
      console.log(stdout);
    } else {
      console.log('❌ Nothing is listening on port 5000');
      console.log('🚨 CRITICAL: Backend server is not running!');
    }
  } catch (error) {
    console.log('❌ No processes found on port 5000');
  }
}

checkProcesses();
