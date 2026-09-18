import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

import { GltfModel } from '../runtime/assets/GltfModel';
import { useAutomaticInput } from '../runtime/input/useAutomaticInput';
import { usePlayer } from '../runtime/player/PlayerContext';
import { SplatModel } from '../runtime/spark/SplatModel';

const SCENE_SPLATS_URL = `${import.meta.env.BASE_URL}scenes/pressure-gauge/splats-lod.rad`;
const SCENE_COLLIDERS_URL = `${import.meta.env.BASE_URL}scenes/pressure-gauge/colliders.glb`;
const DUTO_SEM_VALVULAS_URL = `${import.meta.env.BASE_URL}assets/duto_sem_valvulas.glb`;
const VOLANTE_ESQUERDO_URL = `${import.meta.env.BASE_URL}assets/volante_esquerdo.glb`;
const VOLANTE_DIREITO_URL = `${import.meta.env.BASE_URL}assets/volante_direito.glb`;
const MANOMETRO_URL = `${import.meta.env.BASE_URL}assets/manometro.glb`;
const VENTEIO_URL = `${import.meta.env.BASE_URL}assets/venteio.glb`;
const BOX_URL = `${import.meta.env.BASE_URL}assets/box.glb`;
const PLAYER_SPAWN_POSITION = [0, 0, 0] as const;
const AUTOMATIC_INPUT_IDLE_DELAY = 500;
const AUTOMATIC_YAW_INPUT_SPEED = 0.04;
const AUTOMATIC_PITCH_AMPLITUDE = THREE.MathUtils.degToRad(3);
const AUTOMATIC_PITCH_PERIOD = 5;
const AUTOMATIC_PITCH_RESPONSE = 4;
const AUTOMATIC_MAX_PITCH_SPEED = THREE.MathUtils.degToRad(15);

export const PressureGaugeScene = () => {
  const { spawn, idleTime, getOrientation } = usePlayer();
  const automaticInput = useAutomaticInput();
  const automaticPitchPhaseRef = useRef(0);

  useFrame((_state, delta) => {
    if (idleTime < AUTOMATIC_INPUT_IDLE_DELAY) {
      automaticInput.setOrientationVelocity(0, 0, 0);

      return;
    }

    automaticPitchPhaseRef.current =
      (automaticPitchPhaseRef.current + (Math.PI * 2 * delta) / AUTOMATIC_PITCH_PERIOD) %
      (Math.PI * 2);

    const targetPitch = AUTOMATIC_PITCH_AMPLITUDE * Math.sin(automaticPitchPhaseRef.current);
    const pitchError = targetPitch - getOrientation().pitch;
    const responsivePitchStep = pitchError * (1 - Math.exp(-AUTOMATIC_PITCH_RESPONSE * delta));
    const maximumPitchStep = AUTOMATIC_MAX_PITCH_SPEED * delta;
    const pitchStep = THREE.MathUtils.clamp(
      responsivePitchStep,
      -maximumPitchStep,
      maximumPitchStep,
    );

    automaticInput.addOrientationDelta(pitchStep, 0, 0);
    automaticInput.setOrientationVelocity(0, AUTOMATIC_YAW_INPUT_SPEED, 0);
  });

  return (
    <group>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 10, -5]} />
      <directionalLight position={[10, 5, 5]} />
      <SplatModel url={SCENE_SPLATS_URL} paged onInitialized={() => spawn(PLAYER_SPAWN_POSITION)} />
      <GltfModel url={SCENE_COLLIDERS_URL} visible={false} physicality="fixed" />
      <group
        name="pressure-gauge-assembly"
        position={[4.8, 0.02, 2.6]}
        rotation={[0, -1.7, 0]}
        scale={0.3}
      >
        <GltfModel url={DUTO_SEM_VALVULAS_URL} />
        <GltfModel url={VOLANTE_ESQUERDO_URL} />
        <GltfModel url={VOLANTE_DIREITO_URL} />
        <GltfModel url={MANOMETRO_URL} />
        <GltfModel url={VENTEIO_URL} />
        <GltfModel url={BOX_URL} visible={false} physicality="fixed" scale={[16, 5, 2]} />
      </group>
    </group>
  );
};
