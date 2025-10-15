import { AnyAction, configureStore, ThunkDispatch } from '@reduxjs/toolkit';
import { persistStore, persistReducer, type Persistor, type PersistConfig } from 'redux-persist';
import storage from './storage';
import reducers, { RootState as ReducersRootState } from '@/shared/store/reducers';

const persistConfig: PersistConfig<ReducersRootState> = {
  key: 'root',
  storage,
};

export type RootState = ReducersRootState;

// Factory to create a store (optionally with preloaded state) and its persistor
export function createStore(preloadedState?: Partial<RootState>) {
  const reducer = persistReducer<RootState>(persistConfig, reducers);
  const store = configureStore({
    reducer,
    // Preloaded state is useful for tests
    // Cast to align with persist reducer's PersistPartial; tests may provide partial state without _persist
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
    devTools: true,
  });
  const persistor: Persistor = persistStore(store);
  return { store, persistor };
}

// Default singleton store/persistor for the real app runtime
const defaultSetup = createStore();
const initStore = defaultSetup.store;
export const persistedStore: Persistor = defaultSetup.persistor;

export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
export default initStore;
