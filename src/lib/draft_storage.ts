/** Minimal browser storage contract; callers may provide an in-memory adapter. */
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Passive, versioned per-tab drafts. The owning product supplies a scope;
 * a null scope disables persistence until it has established the right context.
 * Values are never interpreted as instructions or automatically executed.
 */
export function createDraftStore(options: {
  prefix: () => string | null;
  defaultStorage: () => DraftStorage | undefined;
  maxChars: number;
  maxKeyChars: number;
}) {
  function read<T>(key: string, fallback: T, storage?: DraftStorage): T {
    try {
      const prefix = options.prefix();
      if (!prefix) return fallback;
      const raw = (storage ?? options.defaultStorage())?.getItem(prefix + key);
      if (!raw || raw.length > options.maxChars) return fallback;
      const envelope = JSON.parse(raw);
      if (envelope.version !== 1 || !Object.hasOwn(envelope, "value")) return fallback;
      return envelope.value as T;
    } catch {
      return fallback;
    }
  }

  function save(key: string, value: unknown, storage?: DraftStorage): boolean {
    try {
      const prefix = options.prefix();
      if (!prefix || key.length > options.maxKeyChars) return false;
      const target = storage ?? options.defaultStorage();
      if (!target) return false;
      const raw = JSON.stringify({ version: 1, value });
      if (raw.length > options.maxChars) return false;
      target.setItem(prefix + key, raw);
      return true;
    } catch {
      return false;
    }
  }

  function clear(key: string, storage?: DraftStorage): void {
    try {
      const prefix = options.prefix();
      if (prefix) (storage ?? options.defaultStorage())?.removeItem(prefix + key);
    } catch {
      // Unavailable storage cannot prevent clearing the visible draft.
    }
  }

  return { read, save, clear };
}
