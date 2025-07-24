import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

let connection: mysql.Connection;

try {
  connection = await mysql.createConnection({
    host: '98.130.28.156',
    port: 3306,
    user: 'root',
    password: 'P@$sw0rd2001',
    database: 'gmr_db',
  });
  // Connected to MySQL database
} catch (error) {
  throw error;
}

export const db = drizzle(connection, { schema, mode: "default" });
export { connection };
