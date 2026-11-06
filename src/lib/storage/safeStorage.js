// A crash-proof wrapper around localStorage / sessionStorage.
// Browser storage can throw: blocked by privacy settings, Safari private mode, quota full,
// or corrupted JSON. Every call here catches that, logs it, and returns a safe fallback.

/** Every key is namespaced and versioned, so a future data format can use v2 without clashes. */
export const STORAGE_PREFIX = 'launchpad:v1:';

/**
 * @param {() => Storage} getBackend returns the real storage object. Wrapped in a function
 *   because merely *accessing* window.localStorage can throw when storage is blocked.
 */
export function createSafeStorage(getBackend) {
  function backend() {
    try {
      return getBackend() ?? null;
    } catch {
      return null;
    }
  }

  return {
    /** @returns {boolean} whether storage can currently be written */
    isAvailable() {
      const store = backend();
      if (!store) return false;
      try {
        const probeKey = `${STORAGE_PREFIX}probe`;
        store.setItem(probeKey, probeKey);
        store.removeItem(probeKey);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Reads and parses a JSON value. Returns `fallback` if the key is missing,
     * storage is unavailable, or the stored text isn't valid JSON.
     * Callers still validate the *shape* of what comes back.
     */
    readJson(key, fallback) {
      try {
        const text = backend()?.getItem(STORAGE_PREFIX + key);
        return text === null || text === undefined ? fallback : JSON.parse(text);
      } catch (error) {
        console.warn(`Could not read "${key}" from storage:`, error);
        return fallback;
      }
    },

    /** @returns {boolean} true if saved, false if storage refused (caller must handle it) */
    writeJson(key, value) {
      try {
        const store = backend();
        if (!store) return false;
        store.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Could not save "${key}" to storage:`, error);
        return false;
      }
    },

    /** @returns {boolean} true if removed (or already absent) */
    remove(key) {
      try {
        const store = backend();
        if (!store) return false;
        store.removeItem(STORAGE_PREFIX + key);
        return true;
      } catch (error) {
        console.warn(`Could not remove "${key}" from storage:`, error);
        return false;
      }
    },
  };
}

export const browserLocalStorage = createSafeStorage(() => window.localStorage);
export const browserSessionStorage = createSafeStorage(() => window.sessionStorage);
