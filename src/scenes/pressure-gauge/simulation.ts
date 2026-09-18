import { getPressureState } from './pressure';

import type { PressureState, Valve, ValveConfiguration } from './pressure';

export type SimulationStage =
  | 'isolating'
  | 'isolated'
  | 'removed'
  | 'collected'
  | 'restoring'
  | 'complete';

export type SimulationState = {
  stage: SimulationStage;
  valves: ValveConfiguration;
  pressureState: PressureState;
  activeValve: Valve | null;
};

export type SimulationAction =
  | { type: 'set-valve'; valve: Valve; open: boolean }
  | { type: 'finish-valve'; valve: Valve }
  | { type: 'remove-gauge' }
  | { type: 'collect-gauge' }
  | { type: 'install-gauge' };

export const INITIAL_SIMULATION_STATE: SimulationState = {
  stage: 'isolating',
  valves: { montante: true, jusante: true, venteio: false },
  pressureState: 'medium',
  activeValve: null,
};

export const canOperateValve = (state: SimulationState, valve: Valve) =>
  state.activeValve === null &&
  (state.stage === 'isolating' || (state.stage === 'restoring' && valve !== 'venteio'));

export const transitionSimulation = (
  state: SimulationState,
  action: SimulationAction,
): SimulationState => {
  if (action.type === 'finish-valve') {
    return state.activeValve === action.valve ? { ...state, activeValve: null } : state;
  }

  if (state.activeValve !== null) {
    return state;
  }

  if (action.type === 'set-valve') {
    if (!canOperateValve(state, action.valve) || state.valves[action.valve] === action.open) {
      return state;
    }

    const valves = { ...state.valves, [action.valve]: action.open };
    const pressureState = getPressureState(valves, state.pressureState);
    let stage = state.stage;

    if (
      stage === 'isolating' &&
      !valves.montante &&
      !valves.jusante &&
      !valves.venteio &&
      pressureState === 'zero'
    ) {
      stage = 'isolated';
    } else if (stage === 'restoring' && valves.montante && valves.jusante) {
      stage = 'complete';
    }

    return { stage, valves, pressureState, activeValve: action.valve };
  }

  if (action.type === 'remove-gauge' && state.stage === 'isolated') {
    return { ...state, stage: 'removed' };
  }

  if (action.type === 'collect-gauge' && state.stage === 'removed') {
    return { ...state, stage: 'collected' };
  }

  if (action.type === 'install-gauge' && state.stage === 'collected') {
    return { ...state, stage: 'restoring' };
  }

  return state;
};
