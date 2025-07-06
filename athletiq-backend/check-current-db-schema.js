// Check Current Database Schema
const pool = require('./src/config/db');

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...\n');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 EXISTING TABLES:');
    console.log('==================');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\n🔍 DETAILED TABLE STRUCTURES:');
    console.log('==============================');
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`\n📋 ${tableName.toUpperCase()}:`);
      
      // Get columns for this table
      const columnsResult = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`);
      });
    }
    
    // Check for specific tournament-related tables
    console.log('\n🏆 TOURNAMENT-RELATED TABLES CHECK:');
    console.log('===================================');
    
    const tournamentTables = ['tournaments', 'matches', 'teams', 'players'];
    for (const tableName of tournamentTables) {
      const exists = tablesResult.rows.some(row => row.table_name === tableName);
      console.log(`${exists ? '✅' : '❌'} ${tableName}`);
    }
    
    console.log('\n🔍 CHECKING FOREIGN KEY RELATIONSHIPS:');
    console.log('======================================');
    
    const fkResult = await pool.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    fkResult.rows.forEach(row => {
      console.log(`${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    console.log('\n✅ Database schema check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseSchema();
