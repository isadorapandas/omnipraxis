import { ConvaiRuntime } from './runtime/convai/ConvaiRuntime';
import { downloadSessionLog } from './runtime/events/downloadSessionLog';
import { RuntimeApp } from './RuntimeApp';

import type { ComponentType } from 'react';

type AppProps = {
  sceneId: string;
  Scene: ComponentType;
};

const App = ({ sceneId, Scene }: AppProps) => (
  <RuntimeApp
    sceneId={sceneId}
    onSessionComplete={downloadSessionLog}
    canvasRuntimes={<ConvaiRuntime />}
  >
    <Scene />
  </RuntimeApp>
);

export default App;
