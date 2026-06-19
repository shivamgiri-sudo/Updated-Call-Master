// backend/src/config/database.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

interface PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  queueLimit: number;
  waitForConnections: boolean;
}

const createPoolConfig = (
  host: string,
  port: string,
  user: string,
  password: string,
  database: string,
  connectionLimit: number
): PoolConfig => ({
  host,
  port: Number(port),
  user,
  password,
  database,
  connectionLimit,
  queueLimit: 0,
  waitForConnections: true,
});

export const pools = {
  // Dialer DB (CDR source - read-only)
  dialer: mysql.createPool(
    createPoolConfig(
      process.env.DB_DIALER_HOST || '192.168.10.6',
      process.env.DB_DIALER_PORT || '3306',
      process.env.DB_DIALER_USER || 'root',
      process.env.DB_DIALER_PASSWORD || 'vicidialnow',
      process.env.DB_DIALER_NAME || 'dialer_db',
      10
    )
  ),

  // Application DB (read-write)
  app: mysql.createPool(
    createPoolConfig(
      process.env.DB_APP_HOST || '192.168.10.6',
      process.env.DB_APP_PORT || '3306',
      process.env.DB_APP_USER || 'shivam_user',
      process.env.DB_APP_PASSWORD || 'qwersdfg!@#hjk',
      process.env.DB_APP_NAME || 'Shivamgiri',
      20
    )
  ),

  // External DB (legacy audit - read-only)
  external: mysql.createPool(
    createPoolConfig(
      process.env.DB_EXTERNAL_HOST || '122.184.128.90',
      process.env.DB_EXTERNAL_PORT || '3306',
      process.env.DB_EXTERNAL_USER || 'shivam_user',
      process.env.DB_EXTERNAL_PASSWORD || '',
      process.env.DB_EXTERNAL_NAME || 'db_external',
      10
    )
  ),

  // Audit DB (read-only for dashboard)
  audit: mysql.createPool(
    createPoolConfig(
      process.env.DB_AUDIT_HOST || '192.168.10.6',
      process.env.DB_AUDIT_PORT || '3306',
      process.env.DB_AUDIT_USER || 'shivam_user',
      process.env.DB_AUDIT_PASSWORD || 'qwersdfg!@#hjk',
      process.env.DB_AUDIT_NAME || 'db_audit',
      5
    )
  ),
};

// Health check function
export async function testDatabaseConnections(): Promise<{
  dialer: boolean;
  app: boolean;
  external: boolean;
  audit: boolean;
}> {
  const results = {
    dialer: false,
    app: false,
    external: false,
    audit: false,
  };

  try {
    await pools.dialer.query('SELECT 1');
    results.dialer = true;
  } catch (err) {
    console.error('Dialer DB connection failed:', err);
  }

  try {
    await pools.app.query('SELECT 1');
    results.app = true;
  } catch (err) {
    console.error('App DB connection failed:', err);
  }

  try {
    await pools.external.query('SELECT 1');
    results.external = true;
  } catch (err) {
    console.error('External DB connection failed:', err);
  }

  try {
    await pools.audit.query('SELECT 1');
    results.audit = true;
  } catch (err) {
    console.error('Audit DB connection failed:', err);
  }

  return results;
}

// Graceful shutdown
export async function closeDatabaseConnections(): Promise<void> {
  await Promise.all([
    pools.dialer.end(),
    pools.app.end(),
    pools.external.end(),
    pools.audit.end(),
  ]);
}
