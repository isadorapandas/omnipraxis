import type { Valve, ValveConfiguration } from './pressure';

const GAS_UPWARD_SPEED = 0.35;
const GAS_MAXIMUM_JET_SPEED = 6;

// Distances and velocities are assembly-local and inherit its scale.
export const ventGasProps = {
  particleCount: 240,
  lifetime: 3,
  position: [-0.82, 3.12, -0.54],
  spawnRadius: [0.025, 0.025, 0.025],
  velocityDrag: [0, 0, Math.log(2) / 0.5],
  baseScale: [0.035, 0.035, 0.035],
  scaleGrowth: 4,
  opacity: [0.2, 0],
  colors: ['#d8e2e8', '#aab8c2'],
} as const;

export const getGasVelocity = (displayedPressure: number): readonly [number, number, number] => [
  0,
  GAS_UPWARD_SPEED,
  -GAS_MAXIMUM_JET_SPEED * displayedPressure,
];

export const isGasEmitting = (
  valves: ValveConfiguration,
  activeValve: Valve | null,
  displayedPressure: number,
) =>
  (valves.venteio || activeValve === 'venteio') &&
  !(!valves.montante && !valves.jusante && displayedPressure === 0);
