export const sceneManifest = {
  base: {
    title: 'Base Scene',
  },
  'circuit-breaker': {
    title: 'Circuit Breaker',
  },
  'pressure-gauge': {
    title: 'Pressure Gauge',
  },
} as const;

export type SceneSlug = keyof typeof sceneManifest;

export const sceneSlugs = Object.keys(sceneManifest) as SceneSlug[];
