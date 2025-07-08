#!/usr/bin/env node
//
// 🔍 ATHLETIQ - Database Schema Study Tool
//
// This script analyzes the entire database structure, including:
// - All tables and their columns
// - Primary keys and foreign keys
// - Indexes and constraints
// - Data types and nullable fields
// - Sample data from each table
//

const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function studyDatabaseSchema() {
  try {
    console.log('🔍 Starting comprehensive database schema analysis...\n');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      database_info: {},
      tables: {},
      relationships: {},
      constraints: {},
      indexes: {},
      sample_data: {}
    };

    // 1. Get database information
    console.log('📊 Getting database information...');
    const dbInfo = await pool.query(`
      SELECT 
        current_database() as database_name,
        version() as postgres_version,
        current_user as connected_user,
        inet_server_addr() as server_address,
        inet_server_port() as server_port
    `);
    analysis.database_info = dbInfo.rows[0];
    console.log(`   Database: ${analysis.database_info.database_name}`);
    console.log(`   Version: ${analysis.database_info.postgres_version.split(' ')[0]} ${analysis.database_info.postgres_version.split(' ')[1]}`);
    
    // 2. Get all tables
    console.log('\n📋 Getting all tables...');
    const tablesResult = await pool.query(`
      SELECT 
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tableNames = tablesResult.rows.map(row => row.table_name);
    console.log(`   Found ${tableNames.length} tables: ${tableNames.join(', ')}`);
    
    // 3. Get detailed information for each table
    console.log('\n🔍 Analyzing table structures...');
    for (const tableName of tableNames) {
      console.log(`   📊 Analyzing table: ${tableName}`);
      
      // Get columns
      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          udt_name
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      // Get primary key
      const primaryKeyResult = await pool.query(`
        SELECT 
          kcu.column_name,
          kcu.ordinal_position
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position
      `, [tableName]);
      
      // Get foreign keys
      const foreignKeysResult = await pool.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'
      `, [tableName]);
      
      // Get unique constraints
      const uniqueConstraintsResult = await pool.query(`
        SELECT 
          tc.constraint_name,
          array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1 AND tc.constraint_type = 'UNIQUE'
        GROUP BY tc.constraint_name
      `, [tableName]);
      
      // Get check constraints
      const checkConstraintsResult = await pool.query(`
        SELECT 
          tc.constraint_name,
          cc.check_clause
        FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1
      `, [tableName]);
      
      // Get indexes
      const indexesResult = await pool.query(`
        SELECT 
          i.relname as index_name,
          array_agg(a.attname ORDER BY c.ordinality) as columns,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN unnest(ix.indkey) WITH ORDINALITY AS c(colnum, ordinality) ON true
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = c.colnum
        WHERE t.relname = $1
        GROUP BY i.relname, ix.indisunique, ix.indisprimary
        ORDER BY i.relname
      `, [tableName]);
      
      // Get row count
      let rowCount = 0;
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        rowCount = parseInt(countResult.rows[0].count);
      } catch (err) {
        console.log(`     Warning: Could not get row count for ${tableName}: ${err.message}`);
      }
      
      // Get sample data (first 3 rows)
      let sampleData = [];
      try {
        const sampleResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 3`);
        sampleData = sampleResult.rows;
      } catch (err) {
        console.log(`     Warning: Could not get sample data for ${tableName}: ${err.message}`);
      }
      
      analysis.tables[tableName] = {
        columns: columnsResult.rows,
        primary_key: primaryKeyResult.rows,
        foreign_keys: foreignKeysResult.rows,
        unique_constraints: uniqueConstraintsResult.rows,
        check_constraints: checkConstraintsResult.rows,
        indexes: indexesResult.rows,
        row_count: rowCount,
        sample_data: sampleData
      };
    }
    
    // 4. Generate relationships map
    console.log('\n🔗 Mapping table relationships...');
    for (const tableName of tableNames) {
      const table = analysis.tables[tableName];
      if (table.foreign_keys.length > 0) {
        analysis.relationships[tableName] = table.foreign_keys.map(fk => ({
          from: `${tableName}.${fk.column_name}`,
          to: `${fk.foreign_table_name}.${fk.foreign_column_name}`,
          constraint: fk.constraint_name,
          delete_rule: fk.delete_rule,
          update_rule: fk.update_rule
        }));
      }
    }
    
    // 5. Save analysis to file
    const outputPath = path.join(__dirname, 'DATABASE_COMPLETE_ANALYSIS.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    
    // 6. Generate human-readable report
    console.log('\n📄 Generating human-readable report...');
    let report = '';
    report += '# 🏆 ATHLETIQ DATABASE SCHEMA ANALYSIS\n\n';
    report += `Generated on: ${analysis.timestamp}\n`;
    report += `Database: ${analysis.database_info.database_name}\n`;
    report += `PostgreSQL Version: ${analysis.database_info.postgres_version.split(' ')[0]} ${analysis.database_info.postgres_version.split(' ')[1]}\n\n`;
    
    report += '## 📊 TABLES SUMMARY\n\n';
    report += `Total tables: ${tableNames.length}\n\n`;
    
    for (const tableName of tableNames) {
      const table = analysis.tables[tableName];
      report += `### 📋 ${tableName.toUpperCase()}\n`;
      report += `- **Columns:** ${table.columns.length}\n`;
      report += `- **Primary Key:** ${table.primary_key.map(pk => pk.column_name).join(', ') || 'None'}\n`;
      report += `- **Foreign Keys:** ${table.foreign_keys.length}\n`;
      report += `- **Unique Constraints:** ${table.unique_constraints.length}\n`;
      report += `- **Indexes:** ${table.indexes.length}\n`;
      report += `- **Row Count:** ${table.row_count}\n\n`;
      
      // Column details
      report += '**Columns:**\n';
      for (const col of table.columns) {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        const type = col.character_maximum_length ? 
          `${col.data_type}(${col.character_maximum_length})` : 
          col.data_type;
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        report += `- \`${col.column_name}\`: ${type} ${nullable}${defaultVal}\n`;
      }
      
      // Foreign key details
      if (table.foreign_keys.length > 0) {
        report += '\n**Foreign Keys:**\n';
        for (const fk of table.foreign_keys) {
          report += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\` (${fk.constraint_name})\n`;
        }
      }
      
      // Sample data
      if (table.sample_data.length > 0) {
        report += '\n**Sample Data:**\n';
        report += '```json\n';
        report += JSON.stringify(table.sample_data, null, 2);
        report += '\n```\n';
      }
      
      report += '\n---\n\n';
    }
    
    // Relationships summary
    report += '## 🔗 RELATIONSHIPS SUMMARY\n\n';
    for (const [tableName, relationships] of Object.entries(analysis.relationships)) {
      report += `### ${tableName.toUpperCase()} References:\n`;
      for (const rel of relationships) {
        report += `- ${rel.from} → ${rel.to} (${rel.delete_rule}/${rel.update_rule})\n`;
      }
      report += '\n';
    }
    
    const reportPath = path.join(__dirname, 'DATABASE_COMPLETE_ANALYSIS.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('\n✅ Database schema analysis complete!');
    console.log(`📄 JSON Report: ${outputPath}`);
    console.log(`📄 Markdown Report: ${reportPath}`);
    
    // 7. Print summary to console
    console.log('\n📊 QUICK SUMMARY:');
    console.log(`   Total Tables: ${tableNames.length}`);
    console.log(`   Total Relationships: ${Object.keys(analysis.relationships).length}`);
    
    const totalRows = Object.values(analysis.tables).reduce((sum, table) => sum + table.row_count, 0);
    console.log(`   Total Rows: ${totalRows.toLocaleString()}`);
    
    console.log('\n🔍 TABLES WITH DATA:');
    for (const tableName of tableNames) {
      const table = analysis.tables[tableName];
      if (table.row_count > 0) {
        console.log(`   ${tableName}: ${table.row_count} rows`);
      }
    }
    
    console.log('\n🔍 EMPTY TABLES:');
    for (const tableName of tableNames) {
      const table = analysis.tables[tableName];
      if (table.row_count === 0) {
        console.log(`   ${tableName}: 0 rows`);
      }
    }
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error studying database schema:', error);
    throw error;
  }
}

// Run the analysis
if (require.main === module) {
  studyDatabaseSchema()
    .then((analysis) => {
      console.log('\n🎉 Database schema study completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database schema study failed:', error);
      process.exit(1);
    });
}

module.exports = { studyDatabaseSchema };
