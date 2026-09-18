export type ParticleVector = readonly [number, number, number];
export type ParticleVelocity = ParticleVector | (() => ParticleVector);

type Particle = {
  alive: boolean;
  age: number;
  seed: number;
  position: [number, number, number];
  velocity: [number, number, number];
};

export const seededRandom = (seed: number) => {
  const value = Math.sin(seed) * 43758.5453;
  return value - Math.floor(value);
};

export const particleDisplacement = (velocity: number, age: number, drag: number) =>
  drag > 0 ? (velocity * -Math.expm1(-drag * age)) / drag : velocity * age;

export class ParticlePool {
  readonly particles: Particle[];
  private lifetime: number;
  private interval: number;
  private remainder = 0;
  private nextSlot = 0;
  private births = 0;

  constructor(particleCount: number, lifetime: number) {
    if (
      !Number.isInteger(particleCount) ||
      particleCount <= 0 ||
      !Number.isFinite(lifetime) ||
      lifetime <= 0
    ) {
      throw new Error(
        'Particle count must be a positive integer and lifetime must be positive and finite.',
      );
    }

    this.lifetime = lifetime;
    this.interval = lifetime / particleCount;
    this.particles = Array.from({ length: particleCount }, () => ({
      alive: false,
      age: 0,
      seed: 0,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
    }));
  }

  update(
    delta: number,
    emitting: boolean,
    velocity: ParticleVelocity,
    spawnRadius: ParticleVector,
  ) {
    for (const particle of this.particles) {
      if (particle.alive) {
        particle.age += delta;
        particle.alive = particle.age < this.lifetime;
      }
    }

    if (!emitting) {
      this.remainder = 0;
      return;
    }

    const elapsed = this.remainder + delta;
    const count = Math.floor(elapsed / this.interval + 1e-10);
    this.remainder = Math.max(0, elapsed - count * this.interval);

    // After a long frame, only births still within their lifetime need a slot.
    const skipped = Math.max(0, count - this.particles.length);
    this.nextSlot = (this.nextSlot + skipped) % this.particles.length;
    this.births += skipped;

    for (let birth = skipped; birth < count; birth += 1) {
      const particle = this.particles[this.nextSlot];
      const initialVelocity = typeof velocity === 'function' ? velocity() : velocity;
      particle.age = this.remainder + (count - birth - 1) * this.interval;
      particle.alive = particle.age < this.lifetime;
      particle.seed = ++this.births * 12.9898;

      for (let axis = 0; axis < 3; axis += 1) {
        particle.position[axis] =
          (seededRandom(particle.seed + axis + 2) * 2 - 1) * spawnRadius[axis];
        particle.velocity[axis] = initialVelocity[axis];
      }

      this.nextSlot = (this.nextSlot + 1) % this.particles.length;
    }
  }
}
