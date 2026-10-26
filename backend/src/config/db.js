import pg from 'pg';
import dotenv from 'dotenv';
import { createTestDatabase } from '../../tests/testDb.js';

dotenv.config();

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'b2b_orders',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000
    };

export const realPgPool = new Pool(poolConfig);

realPgPool.on('error', (err) => {
  if (process.env.NODE_ENV === 'production') {
    console.error('PostgreSQL client error:', err.message);
  }
});

let activePool = null;
let isEmbedded = false;

export async function initDatabase() {
  if (activePool) return activePool;

  try {
    console.log('📡 Testing connection to PostgreSQL server...');
    const client = await realPgPool.connect();
    await client.query('SELECT 1;');
    client.release();
    activePool = realPgPool;
    isEmbedded = false;
    console.log('✅ Connected to external PostgreSQL database successfully.');
    return activePool;
  } catch (err) {
    console.warn('\n⚠️ Local PostgreSQL service (port 5432) is not currently running.');
    console.warn('💡 Tip: To use an external PostgreSQL database, provide a connection string in backend/.env (e.g., Neon.tech, Supabase, or Render).');
    console.log('⚡ Initializing embedded PostgreSQL memory instance with seed catalog so you can develop and test immediately...');
    
    const embeddedEnv = await createTestDatabase();
    activePool = embeddedEnv.pool;
    isEmbedded = true;
    console.log('✅ Embedded PostgreSQL engine initialized with wholesale catalog & demo accounts.\n');
    return activePool;
  }
}

export const pool = {
  query: async (text, params) => {
    if (!activePool) await initDatabase();
    return activePool.query(text, params);
  },
  connect: async () => {
    if (!activePool) await initDatabase();
    return activePool.connect();
  },
  end: async () => {
    if (activePool && !isEmbedded) {
      return activePool.end();
    }
  }
};

/**
 * Execute a SQL query with parameters using the active database pool
 */
export async function query(text, params) {
  if (!activePool) await initDatabase();
  const start = Date.now();
  const res = await activePool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 100) {
    console.log('Executed query', { text: text.slice(0, 100), duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Helper to execute queries within an atomic database transaction
 */
export async function withTransaction(callback) {
  if (!activePool) await initDatabase();
  const client = await activePool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
