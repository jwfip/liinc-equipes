import { auth } from '@/auth'
import { getEventContext } from '@/lib/event-context'
import { getEventRecords } from '@/lib/event-data'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Call headers() to guarantee that Next.js treats this endpoint as dynamic and doesn't cache it on Vercel
  headers()

  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const ctx = await getEventContext()
    const records = ctx.event ? await getEventRecords(ctx.event.id) : []
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
