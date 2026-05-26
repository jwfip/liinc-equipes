import { db } from '@/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const records = await db.query.mentoringRecords.findMany({
    with: { team: true, mentor: true, block: true },
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  })
  return NextResponse.json(records)
}
