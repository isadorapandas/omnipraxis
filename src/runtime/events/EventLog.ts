export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type LogEvent = Readonly<{
  sequence: number;
  timestamp: string;
  elapsedMs: number;
  type: string;
  source?: string;
  data: JsonValue;
}>;

export type RecordOptions = { source?: string };
export type EventListener = (event: LogEvent) => void | PromiseLike<void>;

type Subscription = { listener: EventListener; active: boolean };
type Notification = { event: LogEvent; subscriptions: Subscription[] };
type EventLogOptions = {
  getTime: () => { timestamp: string; elapsedMs: number };
  onListenerError?: (error: unknown) => void;
};

const freezeJson = (value: JsonValue): JsonValue => {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) {
      freezeJson(child);
    }
    Object.freeze(value);
  }
  return value;
};

const captureData = (data: JsonValue): JsonValue => {
  const json = JSON.stringify(data, (_key, value: unknown) => {
    if (
      value === undefined ||
      typeof value === 'function' ||
      typeof value === 'symbol' ||
      typeof value === 'bigint' ||
      (typeof value === 'number' && !Number.isFinite(value)) ||
      (value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null)
    ) {
      throw new TypeError('Event data must contain only JSON-compatible values.');
    }
    return value;
  });
  return freezeJson(JSON.parse(json) as JsonValue);
};

export class EventLog {
  private events: LogEvent[] = [];
  private subscriptions = new Set<Subscription>();
  private notifications: Notification[] = [];
  private notifying = false;
  private options: EventLogOptions;

  constructor(options: EventLogOptions) {
    this.options = options;
  }

  record = (type: string, data: JsonValue, options: RecordOptions = {}): LogEvent => {
    const capturedData = captureData(data);
    const event: LogEvent = Object.freeze({
      sequence: this.events.length + 1,
      ...this.options.getTime(),
      type,
      ...(options.source === undefined ? {} : { source: options.source }),
      data: capturedData,
    });
    this.events.push(event);
    // Capture membership at append time: new subscribers receive only future events.
    this.notifications.push({ event, subscriptions: [...this.subscriptions] });
    this.notify();
    return event;
  };

  subscribe = (listener: EventListener): (() => void) => {
    const subscription = { listener, active: true };
    this.subscriptions.add(subscription);
    return () => {
      subscription.active = false;
      this.subscriptions.delete(subscription);
    };
  };

  getSnapshot = (): readonly LogEvent[] => Object.freeze([...this.events]);

  private reportListenerError = (error: unknown) => {
    try {
      if (this.options.onListenerError) {
        this.options.onListenerError(error);
      } else {
        console.error('Event Log listener failed.', error);
      }
    } catch {
      // Error reporting must not interrupt other listeners either.
    }
  };

  private notify() {
    if (this.notifying) return;
    this.notifying = true;
    try {
      let notification: Notification | undefined;
      while ((notification = this.notifications.shift())) {
        for (const subscription of notification.subscriptions) {
          if (!subscription.active) continue;
          try {
            const result = subscription.listener(notification.event);
            if (result !== undefined) {
              void Promise.resolve(result).catch(this.reportListenerError);
            }
          } catch (error) {
            this.reportListenerError(error);
          }
        }
      }
    } finally {
      this.notifying = false;
    }
  }
}
