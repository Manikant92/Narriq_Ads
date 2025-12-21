// Noop step for workflow visualization - marks the start of ad generation flow
export const config = {
  type: 'noop' as const,
  name: 'workflow-start',
  description: 'Entry point for the Ad Generation workflow visualization',
  virtualSubscribes: ['ad.generation.started'],
  virtualEmits: ['scrape.requested'],
  flows: ['ad-generation'],
}
