import { db } from '@/db'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Call headers() to guarantee that Next.js treats this endpoint as dynamic and doesn't cache it on Vercel
  headers()

  try {
    const records = await db.query.mentoringRecords.findMany({
      with: { team: true, mentor: true, block: true },
      orderBy: (r, { asc }) => [asc(r.createdAt)],
    })
    console.log(`GET /api/records success. Count: ${records.length}`)
    return NextResponse.json(records, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    })
  } catch (err: any) {
    console.error(`GET /api/records error:`, err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
