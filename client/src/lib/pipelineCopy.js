/** Shared copy for index-based society builder (sim + UI labels). */

export const PIPELINE_CARD_SHELL =
  'w-72 border bg-card text-card-foreground shadow-sm rounded-lg'

export const PIPELINE = {
  sourceLabel: 'Audience description',
  indexNodeLabel: 'Profile index',
  indexMatching: 'Matching stored profiles to your audience…',
  indexComplete: (n, overflowNote) =>
    `Matched ${n} profile${n === 1 ? '' : 's'} from index${overflowNote || ''}`,
  graphLabel: 'Graph assembly',
  outputLabel: '3D network',
  profileOverflow: (n) =>
    `+${n} more profile${n === 1 ? '' : 's'} not shown in this view (see header)`,
  personaOverflow: (n) =>
    `+${n} more persona${n === 1 ? '' : 's'} in the full graph (only 5 rows shown here)`,
}
