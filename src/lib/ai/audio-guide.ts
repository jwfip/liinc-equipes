/** Roteiro do que falar no relato por áudio: um item por campo que a extração da IA preenche. */
export type GuideItem = { key: string; label: string }

export const AUDIO_GUIDE: Record<'mentoring' | 'specialist', GuideItem[]> = {
  mentoring: [
    { key: 'status',     label: 'Status da equipe: no caminho, atenção, emergência ou voando' },
    { key: 'step',       label: 'Em que etapa a equipe está' },
    { key: 'project',    label: 'O projeto (se é a primeira mentoria da equipe ou se ela pivotou)' },
    { key: 'working',    label: 'No que a equipe trabalhou nesta mentoria' },
    { key: 'advice',     label: 'A orientação que você deu' },
    { key: 'pros',       label: 'Pontos positivos' },
    { key: 'cons',       label: 'O que a equipe precisa melhorar' },
    { key: 'obs',        label: 'Observações para facilitadores (só eles veem)' },
    { key: 'suggestion', label: 'Sugestão para o próximo mentor' },
  ],
  specialist: [
    { key: 'topic',  label: 'Tema ou dúvida da equipe' },
    { key: 'advice', label: 'A orientação que você deu' },
    { key: 'obs',    label: 'Observações para facilitadores (só eles veem)' },
  ],
}
