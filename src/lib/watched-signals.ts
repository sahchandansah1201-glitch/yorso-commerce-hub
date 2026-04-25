/**
 * Lightweight per-browser store for "watched" market signals + a derived
 * alerts feed. Phase 1 mock: persists subscription ids and read-state in
 * localStorage; pulls updates from mockIntelligence.
 *
 * Public surface:
 *   - useWatchedSignals(): { isWatched, toggleWatch, watchedIds }
 *   - useSignalAlerts(): { alerts, unreadCount, markAllRead, markRead }
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  findMarketSignalById,
  getAllMarketSignalsFlat,
  type MarketSignal,
  type SignalUpdate,
} from "@/data/mockIntelligence";

const WATCHED_KEY = "yorso-watched-signals";
const READ_KEY = "yorso-read-alerts";

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

const safeParseSet = (raw: string | null): Set<string> => {
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
};

const readWatched = (): Set<string> =>
  typeof window === "undefined" ? new Set() : safeParseSet(localStorage.getItem(WATCHED_KEY));

const readRead = (): Set<string> =>
  typeof window === "undefined" ? new Set() : safeParseSet(localStorage.getItem(READ_KEY));

const writeWatched = (set: Set<string>) => {
  localStorage.setItem(WATCHED_KEY, JSON.stringify(Array.from(set)));
  emit();
};

const writeRead = (set: Set<string>) => {
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set)));
  emit();
};

const subscribe = (l: Listener) => {
  listeners.add(l);
  // React to changes from other tabs.
  const onStorage = (e: StorageEvent) => {
    if (e.key === WATCHED_KEY || e.key === READ_KEY) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

const getWatchedSnapshot = () => {
  // useSyncExternalStore requires a referentially-stable snapshot.
  // Cache by the serialized contents.
  return localStorage.getItem(WATCHED_KEY) ?? "";
};
const getReadSnapshot = () => localStorage.getItem(READ_KEY) ?? "";
const getServerSnapshot = () => "";

export const useWatchedSignals = () => {
  // Subscribe to localStorage changes via emit().
  useSyncExternalStore(subscribe, getWatchedSnapshot, getServerSnapshot);
  const [watched, setWatched] = useState<Set<string>>(() => readWatched());

  useEffect(() => {
    const l = () => setWatched(readWatched());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const isWatched = (signalId: string) => watched.has(signalId);

  const toggleWatch = (signalId: string) => {
    const next = new Set(watched);
    if (next.has(signalId)) {
      next.delete(signalId);
    } else {
      next.add(signalId);
      // When a user starts watching, mark its existing updates as already
      // read so the alerts feed doesn't immediately spam them with old
      // history. The next genuinely-new update would still surface; for
      // mock data this keeps the bell quiet until the user has a reason
      // to look.
      const sig = findMarketSignalById(signalId);
      if (sig?.updates?.length) {
        const read = readRead();
        sig.updates.forEach((u) => read.add(`${signalId}::${u.id}`));
        writeRead(read);
      }
    }
    writeWatched(next);
  };

  return {
    isWatched,
    toggleWatch,
    watchedIds: Array.from(watched),
  };
};

export interface SignalAlert {
  alertId: string; // signalId::updateId
  signalId: string;
  signalText: string;
  signalSeverity: MarketSignal["severity"];
  signalKind: MarketSignal["kind"];
  category: string;
  update: SignalUpdate;
  isRead: boolean;
}

const computeAlerts = (): SignalAlert[] => {
  const watched = readWatched();
  const read = readRead();
  if (watched.size === 0) return [];
  const all = getAllMarketSignalsFlat();
  const out: SignalAlert[] = [];
  for (const sig of all) {
    if (!watched.has(sig.id)) continue;
    if (!sig.updates) continue;
    for (const u of sig.updates) {
      const alertId = `${sig.id}::${u.id}`;
      out.push({
        alertId,
        signalId: sig.id,
        signalText: sig.text,
        signalSeverity: sig.severity,
        signalKind: sig.kind,
        category: sig.category,
        update: u,
        isRead: read.has(alertId),
      });
    }
  }
  return out;
};

export const useSignalAlerts = () => {
  useSyncExternalStore(subscribe, getWatchedSnapshot, getServerSnapshot);
  useSyncExternalStore(subscribe, getReadSnapshot, getServerSnapshot);
  const [alerts, setAlerts] = useState<SignalAlert[]>(() => computeAlerts());

  useEffect(() => {
    const l = () => setAlerts(computeAlerts());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const markAllRead = () => {
    const read = readRead();
    alerts.forEach((a) => read.add(a.alertId));
    writeRead(read);
  };

  const markRead = (alertId: string) => {
    const read = readRead();
    if (read.has(alertId)) return;
    read.add(alertId);
    writeRead(read);
  };

  return { alerts, unreadCount, markAllRead, markRead };
};
