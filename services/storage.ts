import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppData } from '@/types';

/**
 * All persistence lives here, so screens never talk to AsyncStorage directly.
 * Swapping this file for API calls is all a future backend would need.
 *
 * We store the whole app state as one JSON snapshot under a single key.
 * Writing one key is atomic, so groups, expenses and settlements can never
 * get out of sync with each other after a crash mid-save.
 */

const STORAGE_KEY = '@splitease/data';
const STORAGE_VERSION = 1;

interface StoredData {
  version: number;
  data: AppData;
}

/** Minimal shape check so corrupted data doesn't crash the app. */
function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<AppData>;
  return (
    !!data.profile &&
    typeof data.profile.name === 'string' &&
    Array.isArray(data.groups) &&
    Array.isArray(data.expenses) &&
    Array.isArray(data.settlements)
  );
}

export type LoadResult =
  | { status: 'found'; data: AppData }
  | { status: 'empty' }
  /** Data exists but can't be used (bad JSON or old format). */
  | { status: 'corrupt' }
  /** Storage itself failed — the saved data may still be fine. */
  | { status: 'error' };

function parseStoredData(raw: string): LoadResult {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredData>;
    if (parsed.version === STORAGE_VERSION && isAppData(parsed.data)) {
      return { status: 'found', data: parsed.data };
    }
  } catch {
    // fall through — invalid JSON
  }
  return { status: 'corrupt' };
}

export async function loadAppData(): Promise<LoadResult> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { status: 'empty' };
    }
    return parseStoredData(raw);
  } catch (error) {
    console.warn('[storage] Failed to load data', error);
    return { status: 'error' };
  }
}

/** Returns true when the save succeeded. */
export async function saveAppData(data: AppData): Promise<boolean> {
  try {
    const payload: StoredData = { version: STORAGE_VERSION, data };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.warn('[storage] Failed to save data', error);
    return false;
  }
}
