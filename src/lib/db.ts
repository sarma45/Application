import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    pool = new Pool({
      connectionString,
      max: 10,
    });
  }

  return pool;
}

export async function query<R extends any[] = any[]>(text: string, params?: any[]) {
  const client = await getDb().connect();
  try {
    const result = await client.query(text, params);
    return result as { rows: R };
  } finally {
    client.release();
  }
}
