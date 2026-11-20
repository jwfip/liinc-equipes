'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { blocks } from '@/schema'
import { getEventContext } from '@/lib/event-context'
import { requireActiveSession } from '@/lib/guards'
import { canManageBlocks } from '@/lib/participation'
import { setActiveBlock } from '@/lib/block-writes'
import { toActionError, type ActionResult } from '@/lib/action-result'
import { closeBlockError } from '@/lib/blocks'

/** Evento do contexto, se a pessoa pode mudar o bloco dele (facilitador do evento ativo ou admin). */
async function eventForBlocks(): Promise<number> {
  await requireActiveSession()
  const ctx = await getEventContext()
  if (!ctx.event || !canManageBlocks(ctx)) throw new Error('Sem permissão para mudar o bloco.')
  return ctx.event.id
}

function revalidate() {
  revalidatePath('/painel')
  revalidatePath('/mentoria')
  revalidatePath('/acompanhamento')
}

/** Ativa um bloco do evento selecionado (o bloco ativo atual é encerrado). */
export async function activateEventBlock(blockId: number): Promise<ActionResult> {
  try {
    const eventId = await eventForBlocks()
    const block = Number.isInteger(blockId)
      ? await db.query.blocks.findFirst({ where: and(eq(blocks.id, blockId), eq(blocks.eventId, eventId)) })
      : undefined
    if (!block) return { ok: false, error: 'Bloco inválido para este evento.' }
    await setActiveBlock(eventId, block.id)
    revalidate()
    return { ok: true, message: `${block.label} ativado.` }
  } catch (err) {
    return toActionError(err)
  }
}

/** Encerra o bloco que a tela mostra como ativo (nenhum bloco fica ativo). */
export async function closeActiveBlock(blockId: number): Promise<ActionResult> {
  try {
    const eventId = await eventForBlocks()
    const block = Number.isInteger(blockId) ? await db.query.blocks.findFirst({ where: eq(blocks.id, blockId) }) : undefined
    const error = closeBlockError(block, eventId)
    if (error) return { ok: false, error }
    await setActiveBlock(eventId, null)
    revalidate()
    return { ok: true, message: 'Bloco encerrado.' }
  } catch (err) {
    return toActionError(err)
  }
}
