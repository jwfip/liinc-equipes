import { auth } from '@/auth'
import { sessionBlockReason } from '@/lib/session-rules'
import { getEventContext } from '@/lib/event-context'
import { getEventRecords, getEventStepChanges } from '@/lib/event-data'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Call headers() to guarantee that Next.js treats this endpoint as dynamic and doesn't cache it on Vercel
  headers()

  const blocked = sessionBlockReason(await auth())
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 401 })
  }

  try {
    const ctx = await getEventContext()
    const [records, stepChanges] = ctx.event
      ? await Promise.all([getEventRecords(ctx.event.id), getEventStepChanges(ctx.event.id)])
      : [[], []]
    return NextResponse.json({ records, stepChanges }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    })
  } catch (err: any) {
    console.error(`GET /api/records error:`, err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
