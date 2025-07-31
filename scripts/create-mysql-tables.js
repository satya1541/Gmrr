import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: '98.130.6.200',
  port: 3306,
  user: 'satya',
  password: 'satya123',
  database: 'gmr_db',
});

// Create tables
const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    mqtt_broker VARCHAR(255) NOT NULL,
    mqtt_topic VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    last_seen TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  );

  CREATE TABLE IF NOT EXISTS device_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperature VARCHAR(50),
    humidity VARCHAR(50),
    air_quality VARCHAR(50),
    co2_level VARCHAR(50),
    raw_data TEXT
  );
`;

// Split and execute each CREATE TABLE statement
const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
for (const statement of statements) {
  if (statement.trim()) {
    await connection.execute(statement);
    // Statement executed
  }
}

// Insert some default devices
const insertDevicesSQL = `
  INSERT IGNORE INTO devices (device_id, name, mqtt_broker, mqtt_topic, username, password, status, last_seen, is_active) VALUES
  ('EC64C984BAAC', 'Sensor Node 1', 'mqtt.broker.local:1883', 'sensors/EC64C984BAAC', '', '', 'waiting', NOW() - INTERVAL 2 MINUTE, TRUE),
  ('EC64C984E8B0', 'Sensor Node 2', 'mqtt.broker.local:1883', 'sensors/EC64C984E8B0', '', '', 'online', NOW(), TRUE),
  ('EC64C984B274', 'Sensor Node 3', 'mqtt.broker.local:1883', 'sensors/EC64C984B274', '', '', 'waiting', NOW() - INTERVAL 5 MINUTE, TRUE),
  ('EC64C984BAB0', 'Sensor Node 4', 'mqtt.broker.local:1883', 'sensors/EC64C984BAB0', '', '', 'online', NOW() - INTERVAL 30 SECOND, TRUE);
`;

await connection.execute(insertDevicesSQL);
// Inserted default devices

await connection.end();
// Database setup complete