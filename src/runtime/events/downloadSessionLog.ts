import type { SessionSnapshot } from './EventLogSession';

const filenamePart = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');

export const getSessionLogFilename = (snapshot: SessionSnapshot) =>
  `omnipraxis-${filenamePart(snapshot.scene)}-${filenamePart(snapshot.startedAt ?? 'pending')}-${filenamePart(snapshot.sessionId)}.json`;

export const downloadSessionLog = (snapshot: SessionSnapshot) => {
  const blob = new Blob([`${JSON.stringify(snapshot, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getSessionLogFilename(snapshot);
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Allow the browser time to consume the URL before releasing its Blob.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
};
