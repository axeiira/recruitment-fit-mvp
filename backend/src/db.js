import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/recruitment_fit";

// Hosted Postgres (e.g. Neon) requires TLS; local Docker Postgres does not offer it.
const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}
