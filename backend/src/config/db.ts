import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const DB = {
  APP: process.env.DB_APP || "Shivamgiri",
  EXTERNAL: process.env.DB_EXTERNAL || "db_external",
  AUDIT: process.env.DB_AUDIT || "db_audit",
};

export function qid(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `\`${identifier}\``;
}

export const pool = mysql.createPool({
  host: required("DB_HOST"),
  port: Number(process.env.DB_PORT || 3306),
  user: required("DB_USER"),
  password: required("DB_PASSWORD"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  multipleStatements: false,
});
