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
  idleTimeoutMillis: 10_000,        // close idle clients before Neon suspends them
  connectionTimeoutMillis: 10_000,  // fail fast instead of hanging on a dead socket
  keepAlive: true,
});

// A dropped idle connection (e.g. Neon free-tier auto-suspend) emits 'error' on the
// pool; without a handler it can crash the process. Log and let the retry below recover.
pool.on("error", (err) => {
  console.error("Idle Postgres client error (will be retried):", err.message);
});

// Connection-level failures we can safely retry on a fresh connection.
const RETRYABLE = new Set([
  "ECONNRESET", "ETIMEDOUT", "EPIPE", "ENOTFOUND", "ECONNREFUSED",
  "57P01", // admin_shutdown (server terminating connection)
  "08006", "08003", "08001", // connection failure / does-not-exist / unable-to-connect
]);

export async function query(text, params, attempt = 1) {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (err) {
    const transient =
      RETRYABLE.has(err.code) ||
      /terminat|timeout|ECONNRESET|Connection terminated/i.test(err.message || "");
    if (transient && attempt < 3) {
      await new Promise((r) => setTimeout(r, 300 * attempt)); // 300ms, then 600ms
      return query(text, params, attempt + 1);
    }
    throw err;
  }
}
