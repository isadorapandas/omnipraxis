import { useState } from 'react';

import { EventLogContext } from './EventLogContext';
import { EventLogSession } from './EventLogSession';

import type { SessionSnapshot } from './EventLogSession';
import type { ReactNode } from 'react';

type EventLogRuntimeProps = {
  sceneId: string;
  onSessionComplete?: (snapshot: SessionSnapshot) => void;
  children: ReactNode;
};

export const EventLogRuntime = ({ sceneId, onSessionComplete, children }: EventLogRuntimeProps) => {
  const [session] = useState(
    () =>
      new EventLogSession({
        scene: sceneId,
        onComplete: onSessionComplete,
      }),
  );

  return <EventLogContext.Provider value={session}>{children}</EventLogContext.Provider>;
};
