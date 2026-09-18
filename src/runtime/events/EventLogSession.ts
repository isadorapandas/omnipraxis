import { EventLog } from './EventLog';

import type { EventListener, JsonValue, LogEvent, RecordOptions } from './EventLog';

export type SessionSnapshot = Readonly<{
  schemaVersion: 1;
  sessionId: string;
  scene: string;
  status: 'pending' | 'active' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  events: readonly LogEvent[];
}>;

type SessionOptions = {
  scene: string;
  sessionId?: string;
  wallClock?: () => Date;
  monotonicClock?: () => number;
  onComplete?: (snapshot: SessionSnapshot) => void;
  onListenerError?: (error: unknown) => void;
};

export class EventLogSession {
  private log: EventLog;
  private sessionId: string;
  private options: SessionOptions;
  private wallClock: () => Date;
  private monotonicClock: () => number;
  private status: SessionSnapshot['status'] = 'pending';
  private startedAt: string | null = null;
  private completedAt: string | null = null;
  private startedTick = 0;
  private durationMs: number | null = null;

  constructor(options: SessionOptions) {
    this.options = options;
    this.sessionId = options.sessionId ?? crypto.randomUUID();
    this.wallClock = options.wallClock ?? (() => new Date());
    this.monotonicClock = options.monotonicClock ?? (() => performance.now());
    this.log = new EventLog({
      getTime: () => ({
        timestamp: this.wallClock().toISOString(),
        elapsedMs: this.durationMs ?? Math.max(0, this.monotonicClock() - this.startedTick),
      }),
      onListenerError: options.onListenerError,
    });
  }

  startSession = (): boolean => {
    if (this.status !== 'pending') return false;
    this.startedAt = this.wallClock().toISOString();
    this.startedTick = this.monotonicClock();
    this.status = 'active';
    this.log.record('session.started', {}, { source: 'runtime.session' });
    return true;
  };

  record = (type: string, data: JsonValue, options?: RecordOptions): LogEvent | null => {
    if (this.status !== 'active') return null;
    return this.log.record(type, data, options);
  };

  subscribe = (listener: EventListener): (() => void) => this.log.subscribe(listener);

  getSnapshot = (): SessionSnapshot =>
    Object.freeze({
      schemaVersion: 1,
      sessionId: this.sessionId,
      scene: this.options.scene,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      durationMs: this.durationMs,
      events: this.log.getSnapshot(),
    });

  completeSession = (): boolean => {
    if (this.status !== 'active') return false;
    this.completedAt = this.wallClock().toISOString();
    this.durationMs = Math.max(0, this.monotonicClock() - this.startedTick);
    this.status = 'completed';
    this.log.record('session.completed', {}, { source: 'runtime.session' });
    try {
      this.options.onComplete?.(this.getSnapshot());
    } catch (error) {
      console.error(
        'Session completion callback failed; the completed log remains available.',
        error,
      );
    }
    return true;
  };
}
