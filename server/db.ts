import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

// Create connection pool
function createPool() {
  try {
    const pool = mysql.createPool({
      host: "40.192.42.60",
      port: 3306,
      user: "testing",
      password: "testing@2025",
      database: "gmr_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    console.log("Connected to MySQL database using connection pool");
    return pool;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

// Initialize connection pool
const pool = createPool();

async function ensureOfflineEventsTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS device_offline_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(255) NOT NULL,
        offline_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_offline_device_id (device_id),
        INDEX idx_offline_at (offline_at)
      )
    `);
  } catch (error) {
    console.error("Failed to ensure device_offline_events table exists:", error);
    throw error;
  }
}

await ensureOfflineEventsTable();

export const db = drizzle(pool, { schema, mode: "default" });
// We export the pool as connection for compatibility with other files that might import it
export const connection = pool;

