// =======================================================
// ATHLETIQ - LIVE SYSTEM TEST
// =======================================================
// Test running servers and endpoints
// =======================================================

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

console.log('🔴 ATHLETIQ - LIVE SYSTEM TEST');
console.log('==============================');
console.log('');

// Test configuration
const config = {
    backend: {
        host: 'localhost',
        port: 5000,
        protocol: 'http'
    },
    frontend: {
        host: 'localhost',
        port: 3000,
        protocol: 'http'
    }
};

// Test endpoints
const testEndpoints = [
    { path: '/', description: 'Backend Root' },
    { path: '/api/health', description: 'Health Check' },
    { path: '/api/auth/test', description: 'Auth Test Route' },
    { path: '/api/tournaments', description: 'Tournaments API' },
    { path: '/api/players', description: 'Players API' },
    { path: '/api/schools', description: 'Schools API' }
];

function makeRequest(url, timeout = 5000) {
    return new Promise((resolve) => {
        const request = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    success: true,
                    status: res.statusCode,
                    data: data.substring(0, 200) // Limit data length
                });
            });
        });
        
        request.on('error', (error) => {
            resolve({
                success: false,
                error: error.message
            });
        });
        
        request.setTimeout(timeout, () => {
            request.destroy();
            resolve({
                success: false,
                error: 'Request timeout'
            });
        });
    });
}

async function testServerStatus(host, port, name) {
    console.log(`🔍 Testing ${name} server (${host}:${port})...`);
    
    const url = `http://${host}:${port}`;
    const result = await makeRequest(url);
    
    if (result.success) {
        console.log(`✅ ${name} server is running - Status: ${result.status}`);
        return true;
    } else {
        console.log(`❌ ${name} server is not responding - ${result.error}`);
        return false;
    }
}

async function testEndpoint(host, port, path, description) {
    const url = `http://${host}:${port}${path}`;
    const result = await makeRequest(url);
    
    if (result.success) {
        console.log(`✅ ${description} - Status: ${result.status}`);
        if (result.data) {
            console.log(`   Response: ${result.data.substring(0, 100)}...`);
        }
        return true;
    } else {
        console.log(`❌ ${description} - ${result.error}`);
        return false;
    }
}

async function checkProcesses() {
    console.log('🔍 Checking running processes...');
    
    try {
        // Check for node processes
        const nodeProcesses = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
        const nodeLines = nodeProcesses.split('\n').filter(line => line.includes('node.exe'));
        
        console.log(`📊 Found ${nodeLines.length} Node.js processes running`);
        
        // Check for ports
        try {
            const netstat = execSync('netstat -ano | findstr :5000', { encoding: 'utf8' });
            if (netstat.trim()) {
                console.log('✅ Port 5000 is in use (Backend likely running)');
            } else {
                console.log('❌ Port 5000 is not in use (Backend not running)');
            }
        } catch (error) {
            console.log('❌ Port 5000 is not in use (Backend not running)');
        }
        
        try {
            const netstat = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
            if (netstat.trim()) {
                console.log('✅ Port 3000 is in use (Frontend likely running)');
            } else {
                console.log('❌ Port 3000 is not in use (Frontend not running)');
            }
        } catch (error) {
            console.log('❌ Port 3000 is not in use (Frontend not running)');
        }
        
    } catch (error) {
        console.log('⚠️  Could not check processes:', error.message);
    }
    
    console.log('');
}

async function runLiveTests() {
    console.log('Starting live system tests...');
    console.log('');
    
    // Check processes first
    await checkProcesses();
    
    // Test backend server
    const backendRunning = await testServerStatus(
        config.backend.host,
        config.backend.port,
        'Backend'
    );
    
    console.log('');
    
    // Test frontend server
    const frontendRunning = await testServerStatus(
        config.frontend.host,
        config.frontend.port,
        'Frontend'
    );
    
    console.log('');
    
    // Test backend endpoints if backend is running
    if (backendRunning) {
        console.log('🧪 Testing Backend Endpoints...');
        let endpointsPassed = 0;
        
        for (const endpoint of testEndpoints) {
            const success = await testEndpoint(
                config.backend.host,
                config.backend.port,
                endpoint.path,
                endpoint.description
            );
            if (success) endpointsPassed++;
        }
        
        console.log('');
        console.log(`📊 Backend Endpoints: ${endpointsPassed}/${testEndpoints.length} passed`);
        console.log('');
    }
    
    // Test authentication endpoint
    if (backendRunning) {
        console.log('🔐 Testing Authentication...');
        
        // Test login endpoint with POST (will fail but should return proper error)
        const loginTest = await makeRequest(`http://${config.backend.host}:${config.backend.port}/api/auth/login`);
        
        if (loginTest.success && loginTest.status === 405) {
            console.log('✅ Auth endpoint responding (POST method not allowed for GET - expected)');
        } else if (loginTest.success && loginTest.status === 400) {
            console.log('✅ Auth endpoint responding (Bad Request - expected without credentials)');
        } else {
            console.log('❌ Auth endpoint not responding correctly');
        }
        
        console.log('');
    }
    
    // Final results
    console.log('==============================');
    console.log('🎯 LIVE TEST RESULTS');
    console.log('==============================');
    console.log('');
    
    if (backendRunning && frontendRunning) {
        console.log('🎉 BOTH SERVERS ARE RUNNING!');
        console.log('✅ Backend: http://localhost:5000');
        console.log('✅ Frontend: http://localhost:3000');
        console.log('');
        console.log('🚀 System is ready for use!');
        console.log('');
        console.log('🧪 You can now:');
        console.log('   1. Open http://localhost:3000 in your browser');
        console.log('   2. Test user registration and login');
        console.log('   3. Create tournaments and manage athletes');
        console.log('   4. Use all system features');
    } else {
        console.log('❌ SERVERS NOT RUNNING');
        console.log('');
        console.log('🔧 To start the servers:');
        console.log('');
        console.log('1. Start Backend (Terminal 1):');
        console.log('   cd athletiq-backend');
        console.log('   npm start');
        console.log('');
        console.log('2. Start Frontend (Terminal 2):');
        console.log('   cd atheletiq-frontend/athletiq-web');
        console.log('   npm start');
        console.log('');
        console.log('3. Run this test again to verify');
    }
    
    console.log('');
}

// Run the live tests
runLiveTests().catch(console.error);
