import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Use a fallback URL at build time so Vercel doesn't crash when compiling modules
const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost/dummy')
export const db = drizzle(sql, { schema })
