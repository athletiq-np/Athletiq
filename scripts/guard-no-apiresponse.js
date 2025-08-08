// Fails (non-zero exit) if deprecated ApiResponse identifier reappears in source files.
// Lightweight safeguard to prevent regression.
const { execSync } = require('child_process');

try {
  const output = execSync('git ls-files "*.js"', { encoding: 'utf8' });
  const files = output.split(/\r?\n/).filter(Boolean);

  const forbidden = /ApiResponse|apiResponse\b/; // case-sensitive match of legacy symbol
  const offenders = [];

  for (const f of files) {
    // Skip node_modules or dist just in case
    if (f.includes('node_modules') || f.includes('dist')) continue;
    const content = execSync(`git show :"${f}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (forbidden.test(content)) offenders.push(f);
  }

  if (offenders.length) {
    console.error('\n❌ Guard failed: legacy ApiResponse symbol found in:');
    offenders.forEach(o => console.error(' -', o));
    console.error('\nPlease remove these references.');
    process.exit(2);
  }
  console.log('✅ Guard passed: no legacy ApiResponse references detected.');
} catch (err) {
  console.error('Guard execution error:', err.message);
  process.exit(1);
}
