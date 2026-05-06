import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';

const SECURE_STORE_CHUNK_PREFIX = '__chunked__:';
const SECURE_STORE_CHUNK_SIZE = 1800;

const getChunkKey = (key: string, index: number) => `${key}__chunk_${index}`;

const removeChunkedValue = async (key: string) => {
  const existingValue = await SecureStore.getItemAsync(key);

  if (!existingValue?.startsWith(SECURE_STORE_CHUNK_PREFIX)) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  const chunkCount = Number(existingValue.slice(SECURE_STORE_CHUNK_PREFIX.length));
  const deleteOperations = [SecureStore.deleteItemAsync(key)];

  for (let index = 0; index < chunkCount; index += 1) {
    deleteOperations.push(SecureStore.deleteItemAsync(getChunkKey(key, index)));
  }

  await Promise.all(deleteOperations);
};

// SecureStore Adapter for Supabase
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    const storedValue = await SecureStore.getItemAsync(key);

    if (!storedValue?.startsWith(SECURE_STORE_CHUNK_PREFIX)) {
      return storedValue;
    }

    const chunkCount = Number(storedValue.slice(SECURE_STORE_CHUNK_PREFIX.length));
    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) => SecureStore.getItemAsync(getChunkKey(key, index)))
    );

    if (chunks.some((chunk) => chunk === null)) {
      await removeChunkedValue(key);
      return null;
    }

    return chunks.join('');
  },
  setItem: async (key: string, value: string) => {
    await removeChunkedValue(key);

    if (value.length <= SECURE_STORE_CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = value.match(new RegExp(`.{1,${SECURE_STORE_CHUNK_SIZE}}`, 'g')) ?? [];
    await SecureStore.setItemAsync(key, `${SECURE_STORE_CHUNK_PREFIX}${chunks.length}`);
    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(getChunkKey(key, index), chunk))
    );
  },
  removeItem: (key: string) => {
    return removeChunkedValue(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auto-refresh session when app comes to foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});