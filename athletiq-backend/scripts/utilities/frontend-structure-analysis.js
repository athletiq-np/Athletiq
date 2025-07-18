// frontend-structure-analysis.js
const fs = require('fs');
const path = require('path');

function analyzeDirectory(dirPath, prefix = '') {
  const items = [];
  
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        items.push(`${prefix}📁 ${file}/`);
        const subItems = analyzeDirectory(fullPath, prefix + '  ');
        items.push(...subItems);
      } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
        items.push(`${prefix}📄 ${file}`);
      }
    });
  } catch (err) {
    items.push(`${prefix}❌ Error reading directory`);
  }
  
  return items;
}

console.log('🎯 ATHLETIQ FRONTEND STRUCTURE ANALYSIS');
console.log('======================================\n');

// Analyze key frontend directories
const frontendPath = 'E:\\Athletiq\\athletiq-frontend\\athletiq-web\\src';

console.log('📱 FRONTEND COMPONENTS STRUCTURE:');
console.log('==================================');

const componentsPath = path.join(frontendPath, 'components');
if (fs.existsSync(componentsPath)) {
  const structure = analyzeDirectory(componentsPath);
  structure.forEach(item => console.log(item));
} else {
  console.log('❌ Components directory not found');
}

console.log('\n📄 PAGES STRUCTURE:');
console.log('===================');

const pagesPath = path.join(frontendPath, 'pages');
if (fs.existsSync(pagesPath)) {
  const structure = analyzeDirectory(pagesPath);
  structure.forEach(item => console.log(item));
} else {
  console.log('❌ Pages directory not found');
}

console.log('\n🔧 UTILS & HOOKS:');
console.log('=================');

const utilsPath = path.join(frontendPath, 'utils');
if (fs.existsSync(utilsPath)) {
  console.log('📁 utils/');
  const structure = analyzeDirectory(utilsPath, '  ');
  structure.forEach(item => console.log(item));
}

const hooksPath = path.join(frontendPath, 'hooks');
if (fs.existsSync(hooksPath)) {
  console.log('📁 hooks/');
  const structure = analyzeDirectory(hooksPath, '  ');
  structure.forEach(item => console.log(item));
}
