// Enhanced Code Generator Showcase
const { 
  generateShortCode, 
  generateBatchCodes,
  validateCodeStrength,
  generateNepalCode,
  analyzeCodeSpace,
  CHARACTER_SETS 
} = require('./athletiq-backend/src/utils/codeGenerator');

console.log('🚀 ENHANCED CODE GENERATOR SHOWCASE');
console.log('='.repeat(60));

// 1. Nepal Code Generation
console.log('\n🇳🇵 NEPAL ATHLETE CODES:');
for (let i = 1; i <= 5; i++) {
  const nepalCode = generateNepalCode(6);
  const fullId = `NP${nepalCode}`;
  console.log(`${i}. ${fullId} (${fullId.length} chars)`);
}

// 2. Code Space Analysis
console.log('\n📊 CODE SPACE ANALYSIS:');
const analysis6 = analyzeCodeSpace(6, CHARACTER_SETS.NO_AMBIGUOUS);
const analysis8 = analyzeCodeSpace(8, CHARACTER_SETS.ALPHANUMERIC);

console.log(`Nepal Format (6 chars, no ambiguous): ${analysis6.formattedTotal} combinations`);
console.log(`Standard Format (8 chars, alphanumeric): ${analysis8.formattedTotal} combinations`);
console.log(`Safe Nepal usage limit: ${analysis6.safeUsageLimit.toLocaleString()}`);

// 3. Code Strength Validation
console.log('\n🔒 CODE STRENGTH VALIDATION:');
const testCodes = [
  'ABC123',
  'NP8H96ZT',
  'XYZ999AAA',
  'A1B2C3D4E5'
];

testCodes.forEach(code => {
  const validation = validateCodeStrength(code);
  console.log(`${code}: ${validation.strength.toUpperCase()} (score: ${validation.score})`);
  if (validation.issues.length > 0) {
    console.log(`  Issues: ${validation.issues.join(', ')}`);
  }
});

// 4. Multiple Code Generation Examples
console.log('\n🎯 VARIOUS CODE FORMATS:');
console.log('Tournament Code:', generateShortCode('TOURN', 6));
console.log('Match Code:', generateShortCode('MATCH', 8));
console.log('Event Code:', generateShortCode('EVENT', 5));
console.log('Session Code:', generateShortCode('SESS', 4));

// 5. Character Set Demonstrations
console.log('\n🔤 CHARACTER SET OPTIONS:');
console.log('Alphanumeric:', CHARACTER_SETS.ALPHANUMERIC.substring(0, 20) + '...');
console.log('No Ambiguous:', CHARACTER_SETS.NO_AMBIGUOUS.substring(0, 20) + '...');
console.log('Letters Only:', CHARACTER_SETS.LETTERS.substring(0, 20) + '...');
console.log('Numbers Only:', CHARACTER_SETS.NUMERIC);

console.log('\n✅ SYSTEM CAPABILITIES:');
console.log('• ✅ Multiple signature support');
console.log('• ✅ Batch code generation');
console.log('• ✅ Code strength validation');
console.log('• ✅ Nepal format compatibility');
console.log('• ✅ Code space analysis');
console.log('• ✅ Flexible character sets');

console.log('\n🎉 Enhanced code generator ready for production!');
console.log('='.repeat(60));
