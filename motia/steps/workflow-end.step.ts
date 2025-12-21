// Noop step for workflow visualization - marks the end of ad generation flow
export const config = {
  type: 'noop' as const,
  name: 'workflow-end',
  description: 'Exit point for the Ad Generation workflow - all variants ready',
  virtualSubscribes: ['ad.generation.completed'],
  virtualEmits: ['workflow.finished'],
  flows: ['ad-generation'],
}
