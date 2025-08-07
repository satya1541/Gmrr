#!/usr/bin/env node

/**
 * Script to securely initialize or change the admin PIN
 * Usage: node scripts/init-admin-pin.js [new-pin]
 */

import { createConnection } from 'mysql2/promise';

const DB_CONFIG = {
  host: '98.130.6.200',
  user: 'satya', 
  password: 'satya123',
  database: 'gmr_db'
};

async function initAdminPin(newPin) {
  let connection;
  
  try {
    // Validate PIN format
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      console.error('❌ Error: PIN must be exactly 4 digits');
      process.exit(1);
    }
    
    // Connect to database
    connection = await createConnection(DB_CONFIG);
    console.log('✅ Connected to MySQL database');
    
    // Create admin_settings table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Insert or update the admin PIN
    await connection.execute(`
      INSERT INTO admin_settings (setting_key, setting_value) 
      VALUES ('admin_pin', ?) 
      ON DUPLICATE KEY UPDATE 
      setting_value = VALUES(setting_value),
      updated_at = CURRENT_TIMESTAMP
    `, [newPin]);
    
    console.log('✅ Admin PIN has been securely set in the database');
    console.log(`🔐 New PIN: ${newPin}`);
    console.log('⚠️  Keep this PIN safe and change it regularly');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Get PIN from command line argument or prompt for input
const newPin = process.argv[2];

if (!newPin) {
  console.log('Usage: node scripts/init-admin-pin.js <4-digit-pin>');
  console.log('Example: node scripts/init-admin-pin.js 9876');
  process.exit(1);
}

initAdminPin(newPin);