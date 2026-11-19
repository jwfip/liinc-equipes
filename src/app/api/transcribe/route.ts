import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sessionBlockReason } from '@/lib/session-rules'
import { getEventContext } from '@/lib/event-context'
import { getEventSteps } from '@/lib/event-data'
import { registrationError } from '@/lib/participation'
import { chat, transcribe, groqConfigured } from '@/lib/groq'
import { buildExtractionMessages, parseExtraction, isUnclearTranscript, isEmptyExtraction } from '@/lib/ai/extraction'

// Exceção às Server Actions prevista no design: upload binário de áudio.
export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_BYTES = 4 * 1024 * 1024
const UNCLEAR = 'Não consegui entender o áudio. Tente de novo ou digite.'

export async function POST(req: Request) {
  const blocked = sessionBlockReason(await auth())
  if (blocked) return NextResponse.json({ error: blocked }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const audio = form?.get('audio')
  const kind = form?.get('kind') === 'specialist' ? 'specialist' : 'mentoring'
  if (!(audio instanceof Blob) || audio.size === 0) return NextResponse.json({ error: 'Nenhum áudio recebido.' }, { status: 400 })
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: 'Áudio muito longo. Grave até 3 minutos.' }, { status: 413 })

  const ctx = await getEventContext()
  const notAllowed = registrationError(ctx, kind)
  if (notAllowed) return NextResponse.json({ error: notAllowed }, { status: 403 })
  if (!groqConfigured()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  try {
    const type = audio.type || 'audio/webm'
    const ext = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : 'webm'
    const transcript = await transcribe(audio, `relato.${ext}`)
    if (isUnclearTranscript(transcript)) return NextResponse.json({ error: UNCLEAR }, { status: 422 })

    const steps = await getEventSteps(ctx.event!.id)
    const raw = await chat({ messages: buildExtractionMessages(kind, transcript, steps), json: true, maxTokens: 800 })
    const extracted = parseExtraction(raw, kind, steps)
    // Nada aproveitável (ruído, fala sem relação): melhor avisar do que preencher nada em silêncio.
    if (isEmptyExtraction(extracted)) return NextResponse.json({ error: UNCLEAR }, { status: 422 })
    return NextResponse.json({ transcript, ...extracted })
  } catch {
    return NextResponse.json({ error: 'A IA não respondeu agora. Tente de novo ou digite.' }, { status: 502 })
  }
}
