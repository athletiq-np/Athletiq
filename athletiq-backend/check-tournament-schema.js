const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('sports_management.db');

console.log('\n=== TABLES RELATED TO TOURNAMENTS AND MATCHES ===');
db.all("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%match%' OR name LIKE '%bracket%' OR name LIKE '%schedule%' OR name LIKE '%venue%');", (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    rows.forEach(row => {
      console.log('Table:', row.name);
    });
  }
});

console.log('\n=== MATCHES TABLE STRUCTURE ===');
db.all("PRAGMA table_info(matches);", (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    rows.forEach(row => {
      console.log(`${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - ${row.pk ? 'PRIMARY KEY' : ''}`);
    });
  }
});

console.log('\n=== VENUES TABLE STRUCTURE ===');
db.all("PRAGMA table_info(venues);", (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    rows.forEach(row => {
      console.log(`${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - ${row.pk ? 'PRIMARY KEY' : ''}`);
    });
  }
});

console.log('\n=== ALL TABLES IN DATABASE ===');
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    rows.forEach(row => {
      console.log('Table:', row.name);
    });
  }
  db.close();
});
