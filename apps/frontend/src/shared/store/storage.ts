import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

// In SSR (Next.js server), window/localStorage are not available. redux-persist
// warns and falls back to noop storage. Provide our own explicit noop to avoid
// the warning and keep types intact.
function createNoopStorage() {
  return {
      getItem(_key: string) {
          return Promise.resolve(null as unknown as string);
      },
      setItem(_key: string, value: string) {
          return Promise.resolve(value);
      },
      removeItem(_key: string) {
          return Promise.resolve();
      },
  } as unknown as Storage;
}

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage();

export default storage;
