import { AnyAction, configureStore, ThunkDispatch } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from './storage';
import reducers, { RootState as ReducersRootState } from '@/shared/store/reducers';

const persistConfig = {
  key: 'root',
  storage,
};

export type RootState = ReducersRootState;

// Factory to create a store (optionally with preloaded state) and its persistor
export function createStore(preloadedState?: Partial<RootState>) {
  const reducer = persistReducer<RootState>(persistConfig, reducers) as any;
  const store = configureStore({
    reducer,
    // Preloaded state is useful for tests
    preloadedState: preloadedState as any,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
    devTools: true,
  });
  const persistor = persistStore(store as any) as any;
  return { store, persistor };
}

// Default singleton store/persistor for the real app runtime
const defaultSetup = createStore();
const initStore = defaultSetup.store;
export const persistedStore = defaultSetup.persistor as any;

export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;
export default initStore;
