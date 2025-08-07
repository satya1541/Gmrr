import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:password@98.130.6.200:3306/toxishield';

async function migrateDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Starting database migration
    
    // Add alcohol_level column
    await connection.execute(`
      ALTER TABLE device_data 
      ADD COLUMN alcohol_level VARCHAR(50)
    `);
    
    // Drop old columns
    await connection.execute(`
      ALTER TABLE device_data 
      DROP COLUMN temperature,
      DROP COLUMN humidity,
      DROP COLUMN air_quality,
      DROP COLUMN co2_level
    `);
    
    // Migration completed successfully
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await connection.end();
  }
}

migrateDatabase();