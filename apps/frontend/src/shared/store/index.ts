import { AnyAction, configureStore, ThunkDispatch } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from './storage';
import reducers from '@/shared/store/reducers';

const persistConfig = {
  key: 'root',
  storage,
};

const persistedReducer = <any>persistReducer<RootState>(persistConfig, reducers);

const initStore = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: true,
});

export const persistedStore = <any>persistStore(initStore);
export type RootState = ReturnType<typeof initStore.getState>;
export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;
export default initStore;
