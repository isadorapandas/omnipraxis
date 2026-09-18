import { AnimationMixer, LoopOnce, MathUtils } from 'three';

import type { AnimationAction, AnimationClip, Object3D } from 'three';

export type ClipBehavior = {
  start?: number;
  end?: number;
  speed?: number;
  onComplete?: () => void;
};

export type GltfModelHandle = {
  setClipBehavior: (clipName: string, behavior: ClipBehavior) => void;
};

type ControlledClip = {
  action: AnimationAction;
  startTime: number;
  duration: number;
  progress: number;
  end: number;
  speed: number;
  onComplete?: () => void;
};

export class GltfAnimationController implements GltfModelHandle {
  private mixer: AnimationMixer;
  private clips: AnimationClip[];
  private controlled = new Map<string, ControlledClip>();

  constructor(root: Object3D, clips: AnimationClip[]) {
    this.mixer = new AnimationMixer(root);
    this.clips = clips;
  }

  setClipBehavior(clipName: string, { start, end = 1, speed = 1, onComplete }: ClipBehavior) {
    const clip = this.clips.find((candidate) => candidate.name === clipName);

    if (!clip) {
      throw new Error(`GLTF animation clip not found: ${clipName}`);
    }

    if (
      (start !== undefined && (!Number.isFinite(start) || start < 0 || start > 1)) ||
      !Number.isFinite(end) ||
      end < 0 ||
      end > 1 ||
      !Number.isFinite(speed) ||
      speed < 0
    ) {
      throw new Error(
        'Clip progress must be between 0 and 1; speed must be finite and nonnegative.',
      );
    }

    const previous = this.controlled.get(clipName);
    const tracks = clip.tracks.filter((track) => track.times.length > 0);
    const startTime = tracks.length ? Math.min(...tracks.map((track) => track.times[0])) : 0;
    const endTime = tracks.length
      ? Math.max(...tracks.map((track) => track.times[track.times.length - 1]))
      : clip.duration;
    const action = previous?.action ?? this.mixer.clipAction(clip);

    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.paused = true;
    action.play();

    const state: ControlledClip = {
      action,
      startTime,
      duration: Math.max(0, endTime - startTime),
      progress: start ?? previous?.progress ?? 0,
      end,
      speed,
      onComplete,
    };

    this.controlled.set(clipName, state);
    this.applyPose(state);
    this.mixer.update(0);
  }

  update(delta: number) {
    const completed: ControlledClip[] = [];

    for (const state of this.controlled.values()) {
      if (state.speed > 0 && state.progress !== state.end) {
        const step = state.duration > 0 ? (delta * state.speed) / state.duration : Infinity;
        const distance = state.end - state.progress;
        state.progress =
          Math.abs(distance) <= step ? state.end : state.progress + Math.sign(distance) * step;
      }

      this.applyPose(state);

      if (state.progress === state.end && state.onComplete) {
        completed.push(state);
      }
    }

    this.mixer.update(0);

    for (const state of completed) {
      if (this.controlled.get(state.action.getClip().name) !== state) {
        continue;
      }

      const callback = state.onComplete;
      state.onComplete = undefined;
      callback?.();
    }
  }

  dispose() {
    this.controlled.clear();
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }

  private applyPose(state: ControlledClip) {
    state.action.time = MathUtils.lerp(
      state.startTime,
      state.startTime + state.duration,
      state.progress,
    );
  }
}
