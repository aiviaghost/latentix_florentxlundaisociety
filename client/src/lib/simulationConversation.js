export function assistantSummaryText(simulation) {
  if (!simulation) return ''
  const h = simulation.headline || ''
  const n = (simulation.narrative || '').slice(0, 360)
  return [h, n].filter(Boolean).join('\n\n')
}

export function buildConversationFromRounds(rounds) {
  const conv = []
  for (const r of rounds) {
    if (!r.assistant) break
    conv.push({ role: 'user', content: r.userText })
    conv.push({ role: 'assistant', content: assistantSummaryText(r.assistant) })
  }
  return conv
}
