import { extend } from '@react-three/fiber';
import { SplatMesh as SplatMeshImpl } from '@sparkjsdev/spark';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { particleDisplacement, ParticlePool, seededRandom } from './ParticlePool';

import type { ParticleVector, ParticleVelocity } from './ParticlePool';
import type { SplatMeshOptions } from '@sparkjsdev/spark';

const SplatMesh = extend(SplatMeshImpl);

type NumberRange = readonly [number, number];
type ColorRange = readonly [string, string];

type ParticleEmitterProps = {
  particleCount: number;
  spawnRadius: ParticleVector;
  velocity: ParticleVelocity;
  velocityDrag?: ParticleVector;
  turbulence?: number;
  lifetime: number;
  baseScale: ParticleVector;
  scaleGrowth?: number;
  opacity: NumberRange;
  colors: ColorRange;
  emitting?: boolean | (() => boolean);
  position?: ParticleVector;
  rotation?: ParticleVector;
};

const splatQuaternion = new THREE.Quaternion();

export const ParticleEmitter = ({
  particleCount,
  spawnRadius,
  velocity,
  velocityDrag = [0, 0, 0],
  turbulence = 0,
  lifetime,
  baseScale,
  scaleGrowth = 0,
  opacity,
  colors,
  emitting = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: ParticleEmitterProps) => {
  const settings = {
    spawnRadius,
    velocity,
    velocityDrag,
    turbulence,
    baseScale,
    scaleGrowth,
    opacity,
    colors,
    emitting,
  };
  const settingsRef = useRef(settings);
  const lastTimeRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    settingsRef.current = settings;
  });

  const splatMeshArgs = useMemo<[SplatMeshOptions]>(() => {
    const pool = new ParticlePool(particleCount, lifetime);
    const center = new THREE.Vector3();
    const scales = new THREE.Vector3();
    const color = new THREE.Color();
    const colorStart = new THREE.Color();
    const colorEnd = new THREE.Color();

    return [
      {
        maxSplats: particleCount,
        constructSplats: (splats) => {
          for (let index = 0; index < particleCount; index += 1) {
            splats.pushSplat(center, scales, splatQuaternion, 0, color);
          }
        },
        onFrame: ({ mesh, time }) => {
          if (!mesh.packedSplats) {
            return;
          }

          const delta = lastTimeRef.current === null ? 0 : Math.max(0, time - lastTimeRef.current);
          lastTimeRef.current = time;
          const current = settingsRef.current;
          const isEmitting =
            typeof current.emitting === 'function' ? current.emitting() : current.emitting;
          pool.update(delta, isEmitting, current.velocity, current.spawnRadius);
          colorStart.set(current.colors[0]);
          colorEnd.set(current.colors[1]);

          for (let index = 0; index < particleCount; index += 1) {
            const particle = pool.particles[index];
            const phase = Math.min(particle.age / lifetime, 1);
            const { seed, age } = particle;

            for (let axis = 0; axis < 3; axis += 1) {
              center.setComponent(
                axis,
                particle.position[axis] +
                  particleDisplacement(particle.velocity[axis], age, current.velocityDrag[axis]),
              );
              scales.setComponent(
                axis,
                current.baseScale[axis] * (1 + current.scaleGrowth * phase),
              );
            }

            center.x += Math.sin(age * 2 + seed) * current.turbulence * phase;
            center.z += Math.cos((age * 2 + seed) * 0.83) * current.turbulence * phase;
            const colorMix =
              (Math.sin(phase * Math.PI * 2 + seededRandom(seed + 1) * Math.PI * 2) + 1) / 2;
            color.copy(colorStart).lerp(colorEnd, colorMix);

            mesh.packedSplats.setSplat(
              index,
              center,
              scales,
              splatQuaternion,
              particle.alive
                ? THREE.MathUtils.lerp(current.opacity[0], current.opacity[1], phase)
                : 0,
              color,
            );
          }

          mesh.packedSplats.needsUpdate = true;
          mesh.needsUpdate = true;
        },
      },
    ];
  }, [lifetime, particleCount]);

  useLayoutEffect(() => {
    lastTimeRef.current = null;
  }, [splatMeshArgs]);

  return <SplatMesh args={splatMeshArgs} position={position} rotation={rotation} />;
};
