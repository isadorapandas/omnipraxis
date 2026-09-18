import type { SimulationAction, SimulationState } from './simulation';
import type { EventLogAPI } from '../../runtime/events/EventLogContext';

type TrainingLog = Pick<EventLogAPI, 'record' | 'completeSession'>;
const SOURCE = { source: 'scene.pressure-gauge' };

const logicalState = (state: SimulationState) => ({
  stage: state.stage,
  valves: state.valves,
  pressureState: state.pressureState,
});

export const recordTrainingStart = (log: TrainingLog, initialState: SimulationState) => {
  log.record('training.started', { initialState: logicalState(initialState) }, SOURCE);
};

export const recordTrainingTransition = (
  log: TrainingLog,
  previous: SimulationState,
  next: SimulationState,
  action: SimulationAction,
) => {
  if (previous === next || action.type === 'finish-valve') return;
  const resultingState = logicalState(next);

  if (action.type === 'set-valve') {
    log.record(
      'valve.changed',
      {
        valve: action.valve,
        previous: previous.valves[action.valve] ? 'open' : 'closed',
        current: next.valves[action.valve] ? 'open' : 'closed',
        resultingState,
      },
      SOURCE,
    );
  } else {
    const eventType = {
      'remove-gauge': 'gauge.removed',
      'collect-gauge': 'gauge.collected',
      'install-gauge': 'gauge.installed',
    }[action.type];
    log.record(eventType, { resultingState }, SOURCE);
  }

  if (previous.pressureState !== next.pressureState) {
    log.record(
      'pressure.changed',
      {
        previous: previous.pressureState,
        current: next.pressureState,
        resultingState,
      },
      SOURCE,
    );
  }

  if (previous.stage !== next.stage) {
    log.record(
      'training.stage-changed',
      {
        previous: previous.stage,
        current: next.stage,
        resultingState,
      },
      SOURCE,
    );
  }

  if (previous.stage !== 'complete' && next.stage === 'complete') {
    log.record('training.completed', { finalState: resultingState }, SOURCE);
    log.completeSession();
  }
};
