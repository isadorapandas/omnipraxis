export type Valve = 'montante' | 'jusante' | 'venteio';
export type ValveConfiguration = Record<Valve, boolean>;
export type PressureState = 'zero' | 'low' | 'medium' | 'high';

export const PRESSURE_VALUES: Record<PressureState, number> = {
  zero: 0,
  low: 1 / 3,
  medium: 2 / 3,
  high: 1,
};

const PRESSURE_RESPONSE_RATE = -Math.log(0.05) / 2;

export const getPressureState = (
  { montante, jusante, venteio }: ValveConfiguration,
  previousPressureState: PressureState,
): PressureState => {
  if (!montante && !jusante) {
    return venteio ? 'zero' : previousPressureState;
  }

  if (montante && jusante) {
    return venteio ? 'low' : 'medium';
  }

  if (montante) {
    return venteio ? 'medium' : 'high';
  }

  return venteio ? 'zero' : 'low';
};

export const advanceDisplayedPressure = (
  displayedPressure: number,
  pressureState: PressureState,
  delta: number,
) => {
  const next =
    displayedPressure +
    (PRESSURE_VALUES[pressureState] - displayedPressure) *
      (1 - Math.exp(-PRESSURE_RESPONSE_RATE * delta));

  return pressureState === 'zero' && next < 0.001 ? 0 : next;
};
