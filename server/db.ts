import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

let connection: mysql.Connection;

try {
  connection = await mysql.createConnection({
    host: '98.130.6.200',
    port: 3306,
    user: 'satya',
    password: 'satya123',
    database: 'gmr_db',
  });
  // Connected to MySQL database
} catch (error) {
  throw error;
}

export const db = drizzle(connection, { schema, mode: "default" });
export { connection };
