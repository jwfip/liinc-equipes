
const BASE = 'https://api.groq.com/openai/v1'
const TIMEOUT_MS = 20_000

export const SUMMARY_MODEL    = () => process.env.GROQ_SUMMARY_MODEL || 'openai/gpt-oss-20b'
export const TRANSCRIBE_MODEL = () => process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo'
export const groqConfigured   = () => !!process.env.GROQ_API_KEY

export class GroqError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

function headers(): Record<string, string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new GroqError(0, 'IA não configurada.')
  return { Authorization: `Bearer ${key}` }
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function chat(opts: { messages: ChatMessage[]; json?: boolean; maxTokens?: number; model?: string }): Promise<string> {
  const model = opts.model ?? SUMMARY_MODEL()
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model,
      messages: opts.messages,
      max_completion_tokens: opts.maxTokens ?? 600,
      temperature: 0.3,
      ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) throw new GroqError(res.status, `Falha na IA (${res.status}).`)
  const data = await res.json()
  return String(data?.choices?.[0]?.message?.content ?? '')
}

export async function transcribe(file: Blob, filename: string): Promise<string> {
  const fd = new FormData()
  fd.set('file', file, filename)
  fd.set('model', TRANSCRIBE_MODEL())
  fd.set('language', 'pt')
  fd.set('response_format', 'json')
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: 'POST', headers: headers(), body: fd, signal: AbortSignal.timeout(TIMEOUT_MS * 2),
  })
  if (!res.ok) throw new GroqError(res.status, `Falha na transcrição (${res.status}).`)
  const data = await res.json()
  return String(data?.text ?? '').trim()
}
