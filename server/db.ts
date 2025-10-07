import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

// Create connection function
async function createConnection() {
  try {
    const connection = await mysql.createConnection({
      host: "40.192.41.79",
      port: 3306,
      user: "satya",
      password: "Satya@12345",
      database: "gmr_db",
    });
    console.log("Connected to MySQL database");
    return connection;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

// Initialize connection
const connection = await createConnection();

export const db = drizzle(connection, { schema, mode: "default" });
export { connection };
