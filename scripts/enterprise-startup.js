#!/usr/bin/env node

// Enterprise System Startup Validator
// Validates all components before starting the AthletiQ system

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const success = (message) => log(`✅ ${message}`, 'green');
const error = (message) => log(`❌ ${message}`, 'red');
const warning = (message) => log(`⚠️  ${message}`, 'yellow');
const info = (message) => log(`ℹ️  ${message}`, 'blue');
const header = (message) => log(`\n🎯 ${message}`, 'purple');

// System checks
const checks = {
  nodeVersion: () => {
    try {
      const version = process.version;
      const majorVersion = parseInt(version.split('.')[0].substring(1));
      if (majorVersion >= 18) {
        success(`Node.js version: ${version}`);
        return true;
      } else {
        error(`Node.js version ${version} is too old. Requires 18.x or higher`);
        return false;
      }
    } catch (err) {
      error(`Failed to check Node.js version: ${err.message}`);
      return false;
    }
  },

  npmVersion: () => {
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      success(`npm version: ${version}`);
      return true;
    } catch (err) {
      error(`npm not found or not working: ${err.message}`);
      return false;
    }
  },

  projectStructure: () => {
    const requiredPaths = [
      'athletiq-backend',
      'athletiq-frontend/athletiq-web',
      'docs',
      'scripts',
      'tests',
      'production'
    ];

    let allExists = true;
    for (const reqPath of requiredPaths) {
      if (fs.existsSync(reqPath)) {
        success(`Directory exists: ${reqPath}`);
      } else {
        error(`Missing directory: ${reqPath}`);
        allExists = false;
      }
    }
    return allExists;
  },

  backendDependencies: () => {
    try {
      const packagePath = path.join('athletiq-backend', 'package.json');
      if (!fs.existsSync(packagePath)) {
        error('Backend package.json not found');
        return false;
      }

      const nodeModulesPath = path.join('athletiq-backend', 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        warning('Backend node_modules not found, installing...');
        execSync('cd athletiq-backend && npm install', { stdio: 'inherit' });
      }

      success('Backend dependencies checked');
      return true;
    } catch (err) {
      error(`Backend dependency check failed: ${err.message}`);
      return false;
    }
  },

  frontendDependencies: () => {
    try {
      const packagePath = path.join('athletiq-frontend', 'athletiq-web', 'package.json');
      if (!fs.existsSync(packagePath)) {
        error('Frontend package.json not found');
        return false;
      }

      const nodeModulesPath = path.join('athletiq-frontend', 'athletiq-web', 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        warning('Frontend node_modules not found, installing...');
        execSync('cd athletiq-frontend/athletiq-web && npm install', { stdio: 'inherit' });
      }

      success('Frontend dependencies checked');
      return true;
    } catch (err) {
      error(`Frontend dependency check failed: ${err.message}`);
      return false;
    }
  },

  environmentFiles: () => {
    const envFiles = [
      { path: 'athletiq-backend/.env', example: 'athletiq-backend/.env.example' },
      { path: 'athletiq-frontend/athletiq-web/.env', example: 'athletiq-frontend/athletiq-web/.env.example' }
    ];

    let allValid = true;
    for (const env of envFiles) {
      if (fs.existsSync(env.path)) {
        success(`Environment file exists: ${env.path}`);
      } else if (fs.existsSync(env.example)) {
        warning(`Environment file missing: ${env.path}, copying from example`);
        fs.copyFileSync(env.example, env.path);
        success(`Created: ${env.path}`);
      } else {
        error(`Environment file and example missing: ${env.path}`);
        allValid = false;
      }
    }
    return allValid;
  },

  postgresConnection: () => {
    try {
      // Check if PostgreSQL is accessible
      execSync('pg_isready', { stdio: 'pipe' });
      success('PostgreSQL is running and accessible');
      return true;
    } catch (err) {
      warning('PostgreSQL connection check failed. Make sure PostgreSQL is installed and running');
      info('Install PostgreSQL: https://www.postgresql.org/download/');
      return false;
    }
  },

  portAvailability: () => {
    const { createServer } = require('net');
    const ports = [5000, 3000]; // Backend and frontend ports
    
    return new Promise((resolve) => {
      let checkedPorts = 0;
      let allAvailable = true;

      for (const port of ports) {
        const server = createServer();
        
        server.listen(port, () => {
          server.close(() => {
            success(`Port ${port} is available`);
            checkedPorts++;
            if (checkedPorts === ports.length) {
              resolve(allAvailable);
            }
          });
        });

        server.on('error', () => {
          warning(`Port ${port} is already in use`);
          allAvailable = false;
          checkedPorts++;
          if (checkedPorts === ports.length) {
            resolve(allAvailable);
          }
        });
      }
    });
  }
};

// Main validation function
async function validateSystem() {
  header('ATHLETIQ ENTERPRISE SYSTEM VALIDATION');
  
  info('Checking system requirements...');
  
  let allPassed = true;
  const results = {};

  // Run synchronous checks
  for (const [checkName, checkFn] of Object.entries(checks)) {
    if (checkName === 'portAvailability') continue; // Skip async check for now
    
    try {
      results[checkName] = checkFn();
      if (!results[checkName]) allPassed = false;
    } catch (err) {
      error(`Check ${checkName} failed: ${err.message}`);
      results[checkName] = false;
      allPassed = false;
    }
  }

  // Run async checks
  try {
    results.portAvailability = await checks.portAvailability();
    if (!results.portAvailability) allPassed = false;
  } catch (err) {
    error(`Port availability check failed: ${err.message}`);
    results.portAvailability = false;
    allPassed = false;
  }

  // Summary
  header('VALIDATION SUMMARY');
  
  if (allPassed) {
    success('All system checks passed! 🎉');
    success('System is ready for enterprise deployment');
    
    info('\nNext steps:');
    info('1. Configure your database settings in .env files');
    info('2. Run: npm run start:enterprise');
    info('3. Access the system at http://localhost:3000');
    
  } else {
    error('Some system checks failed');
    warning('Please fix the issues above before starting the system');
    
    // Show failed checks
    const failedChecks = Object.entries(results)
      .filter(([, passed]) => !passed)
      .map(([check]) => check);
    
    if (failedChecks.length > 0) {
      warning(`Failed checks: ${failedChecks.join(', ')}`);
    }
  }

  return allPassed;
}

// Enterprise startup function
async function startupEnterprise() {
  const isValid = await validateSystem();
  
  if (!isValid) {
    process.exit(1);
  }
  
  if (process.argv.includes('--start')) {
    header('STARTING ENTERPRISE SYSTEM');
    
    info('Starting backend server...');
    const backend = execSync('cd athletiq-backend && npm start', { 
      stdio: 'inherit',
      detached: true 
    });
    
    setTimeout(() => {
      info('Starting frontend development server...');
      execSync('cd athletiq-frontend/athletiq-web && npm start', { 
        stdio: 'inherit' 
      });
    }, 3000);
  }
}

// CLI interface
if (require.main === module) {
  startupEnterprise().catch(err => {
    error(`Enterprise startup failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { validateSystem, startupEnterprise };
