/**
 * Tagged-template SQL client backed by postgres.js
 *
 * Drop-in replacement for the previous @neondatabase/serverless client.
 * Usage: const rows = await sql`SELECT * FROM table WHERE id = ${id}`
 *
 * Connection string comes from SUPABASE_DB_URL (the direct Postgres connection
 * from your Supabase project dashboard → Settings → Database → Connection string
 * → URI, Transaction mode on port 5432 for Vercel serverless).
 *
 * Set DATABASE_URL in your .env / Vercel environment variables.
 */
import postgres from 'postgres'

let _sql = null

function getSql() {
  if (_sql) return _sql

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    const broken = () => {
      throw new Error(
        'DATABASE_URL is not set. Add it to your .env file or Vercel environment variables.'
      )
    }
    broken.begin = broken
    return broken
  }

  _sql = postgres(connectionString, {
    max: 10,           // max connections in pool
    idle_timeout: 20,  // close idle connections after 20 s
    connect_timeout: 10,
  })

  return _sql
}

// Proxy so callers can do: await sql`SELECT 1`  or  sql.begin(...)
const sql = new Proxy(
  function (...args) { return getSql()(...args) },
  {
    get(_, prop) {
      return getSql()[prop]
    },
  }
)

export default sql
