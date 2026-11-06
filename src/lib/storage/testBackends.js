// Fake storage backends for unit tests (Node has no localStorage).

/** Behaves like localStorage, backed by a Map. */
export function createMemoryBackend(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
    items,
  };
}

/** Behaves like blocked or full storage: every call throws. */
export function createThrowingBackend() {
  const fail = () => {
    throw new Error('Storage is blocked');
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}
