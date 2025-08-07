import mysql from 'mysql2/promise';

async function checkDeviceStatus() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: '98.130.6.200',
      port: 3306,
      user: 'satya',
      password: 'satya123',
      database: 'gmr_db',
    });

    console.log('Connected to MySQL database');

    // Check the test12345 device status
    const [rows] = await connection.execute(
      'SELECT id, device_id, name, is_active FROM devices WHERE device_id = ?',
      ['test12345']
    );

    console.log('Device status for test12345:', rows);

    // Delete the device completely if it exists
    if (rows.length > 0) {
      const [deleteResult] = await connection.execute(
        'DELETE FROM devices WHERE device_id = ?',
        ['test12345']
      );
      console.log('Delete result:', deleteResult);
      
      // Verify the deletion
      const [verifyRows] = await connection.execute(
        'SELECT id, device_id, name, is_active FROM devices WHERE device_id = ?',
        ['test12345']
      );
      console.log('After deletion (should be empty):', verifyRows);
    }

    // Show all active devices
    const [activeDevices] = await connection.execute(
      'SELECT id, device_id, name, is_active FROM devices WHERE is_active = 1'
    );
    console.log('All active devices:', activeDevices);

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDeviceStatus();