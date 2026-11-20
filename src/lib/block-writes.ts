import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { blocks } from '@/schema'

/**
 * Deixa `blockId` como o único bloco ativo do evento (`null` = nenhum). Usa db.batch (transação não
 * interativa no neon-http): o índice único parcial é checado linha a linha, então desativar e ativar
 * num único UPDATE falharia. Não checa permissão: quem chama já autorizou.
 */
export async function setActiveBlock(eventId: number, blockId: number | null): Promise<void> {
  const off = db.update(blocks).set({ active: false }).where(and(eq(blocks.eventId, eventId), eq(blocks.active, true)))
  if (blockId === null) { await off; return }
  await db.batch([off, db.update(blocks).set({ active: true }).where(and(eq(blocks.id, blockId), eq(blocks.eventId, eventId)))])
}
