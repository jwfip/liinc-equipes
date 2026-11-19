/** Observações para facilitadores: quem não pode ver todas recebe só as próprias. Aplicar no servidor. */
export function redactPrivateNotes<R extends { obs: string | null; mentorId: string }>(
  records: R[],
  viewer: { canSeeAll: boolean; mentorId: string | null },
): R[] {
  if (viewer.canSeeAll) return records
  return records.map(r => (r.obs !== null && r.mentorId !== viewer.mentorId ? { ...r, obs: null } : r))
}
