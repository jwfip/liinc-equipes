'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { mentoringRecords, mentors, blocks } from '@/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function submitMentoria(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Não autenticado')

  const mentor = await db.query.mentors.findFirst({
    where: eq(mentors.email, session.user.email),
  })
  if (!mentor) throw new Error('Mentor não encontrado. Contate o organizador.')
  if (!mentor.active) throw new Error('Seu acesso de mentor está desativado.')

  const block = await db.query.blocks.findFirst({
    where: eq(blocks.active, true),
  })
  if (!block) throw new Error('Nenhum bloco ativo no momento.')

  const teamId = formData.get('teamId') as string
  const status = formData.get('status') as string
  const working = formData.get('working') as string
  const advice  = formData.get('advice')  as string

  if (!teamId || !status || !working || !advice) {
    throw new Error('Campos obrigatórios não preenchidos.')
  }

  await db.insert(mentoringRecords).values({
    teamId,
    mentorId: mentor.id,
    blockId:  block.id,
    status,
    working,
    advice,
    pros:       (formData.get('pros') as string) || null,
    cons:       (formData.get('cons') as string) || null,
    obs:        (formData.get('obs')  as string) || null,
    suggestion: (formData.get('suggestion') as string) || null,
  })

  revalidatePath('/painel')
}

export async function updateMentoria(recordId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Não autenticado')

  const mentor = await db.query.mentors.findFirst({
    where: eq(mentors.email, session.user.email),
  })
  if (!mentor) throw new Error('Mentor não encontrado. Contate o organizador.')

  const record = await db.query.mentoringRecords.findFirst({
    where: eq(mentoringRecords.id, recordId)
  })
  if (!record) throw new Error('Registro não encontrado.')
  if (record.mentorId !== mentor.id) throw new Error('Você não tem permissão para editar este registro.')

  const status = formData.get('status') as string
  const working = formData.get('working') as string
  const advice  = formData.get('advice')  as string

  if (!status || !working || !advice) {
    throw new Error('Campos obrigatórios não preenchidos.')
  }

  await db.update(mentoringRecords).set({
    status,
    working,
    advice,
    pros:       (formData.get('pros') as string) || null,
    cons:       (formData.get('cons') as string) || null,
    obs:        (formData.get('obs')  as string) || null,
    suggestion: (formData.get('suggestion') as string) || null,
  }).where(eq(mentoringRecords.id, recordId))

  revalidatePath('/painel')
}
