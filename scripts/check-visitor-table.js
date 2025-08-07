import mysql from 'mysql2/promise';

async function checkVisitorTable() {
  try {
    const connection = await mysql.createConnection({
      host: '98.130.6.200',
      port: 3306,
      user: 'satya',
      password: 'satya123',
      database: 'gmr_db',
    });
    
    console.log('Connected to MySQL database');
    
    // Check if visitor_logs table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'visitor_logs'");
    console.log('visitor_logs table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Check table structure
      const [columns] = await connection.execute("DESCRIBE visitor_logs");
      console.log('Table structure:', columns);
      
      // Check if there are any visitor logs
      const [count] = await connection.execute("SELECT COUNT(*) as total FROM visitor_logs");
      console.log('Current visitor logs count:', count[0].total);
    } else {
      console.log('visitor_logs table does not exist - this explains why no real visitor data is being collected');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkVisitorTable();