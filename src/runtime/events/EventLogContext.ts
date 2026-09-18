import { createContext, useContext } from 'react';

import type { EventLogSession } from './EventLogSession';

export type EventLogAPI = Pick<
  EventLogSession,
  'record' | 'subscribe' | 'getSnapshot' | 'startSession' | 'completeSession'
>;

export const EventLogContext = createContext<EventLogAPI | null>(null);

export const useEventLog = () => {
  const log = useContext(EventLogContext);
  if (!log) throw new Error('useEventLog must be used within EventLogRuntime.');
  return log;
};
