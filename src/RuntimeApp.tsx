import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';

import { EventLogRuntime } from './runtime/events/EventLogRuntime';
import { InputRuntime } from './runtime/input/InputRuntime';
import { PlayerRuntime } from './runtime/player/PlayerRuntime';
import { SparkRuntime } from './runtime/spark/SparkRuntime';
import { UIRuntime } from './runtime/ui/UIRuntime';

import type { SessionSnapshot } from './runtime/events/EventLogSession';
import type { ReactNode } from 'react';

const PHYSICS_TIME_STEP = 0.01;

type RuntimeAppProps = {
  sceneId: string;
  onSessionComplete?: (snapshot: SessionSnapshot) => void;
  canvasRuntimes?: ReactNode;
  children: ReactNode;
};

export const RuntimeApp = ({
  sceneId,
  onSessionComplete,
  canvasRuntimes,
  children,
}: RuntimeAppProps) => (
  <EventLogRuntime key={sceneId} sceneId={sceneId} onSessionComplete={onSessionComplete}>
    <Canvas gl={{ alpha: false, antialias: false }}>
      <SparkRuntime />
      <InputRuntime />
      {canvasRuntimes}

      <UIRuntime>
        <Suspense fallback={null}>
          <Physics timeStep={PHYSICS_TIME_STEP}>
            <PlayerRuntime physicsTimeStep={PHYSICS_TIME_STEP}>{children}</PlayerRuntime>
          </Physics>
        </Suspense>
      </UIRuntime>
    </Canvas>
  </EventLogRuntime>
);
