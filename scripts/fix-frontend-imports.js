const fs = require('fs');
const path = require('path');

// List of files to fix and their import corrections
const fixes = [
  {
    file: 'src/pages/admin/tournaments/TournamentCreate.jsx',
    fixes: [
      {
        find: /^(?!import.*from)/m,
        replace: "import React, { useState, useEffect, useNavigate } from 'react';\n"
      }
    ]
  }
];

// Apply fixes to each file
function applyFixes() {
  const frontendPath = path.join(__dirname, '../athletiq-frontend/athletiq-web');
  
  fixes.forEach(({ file, fixes: fileFixes }) => {
    const filePath = path.join(frontendPath, file);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      fileFixes.forEach(({ find, replace }) => {
        content = content.replace(find, replace);
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${file}`);
    } else {
      console.log(`File not found: ${file}`);
    }
  });
}

console.log('Applying frontend import fixes...');
applyFixes();
console.log('Frontend fixes complete!');
