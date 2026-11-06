import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadAppData, saveAppData } from '@/services/storage';
import { createSeedData } from '@/utils/seedData';

describe('storage service', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('reports empty storage on first launch', async () => {
    expect(await loadAppData()).toEqual({ status: 'empty' });
  });

  it('restores exactly what was saved', async () => {
    const data = createSeedData();
    data.expenses = data.expenses.slice(1); // simulate a deleted expense
    expect(await saveAppData(data)).toBe(true);
    expect(await loadAppData()).toEqual({ status: 'found', data });
  });

  it('flags corrupted data instead of crashing', async () => {
    const key = '@splitease/data';
    await AsyncStorage.setItem(key, '{not json');
    expect(await loadAppData()).toEqual({ status: 'corrupt' });

    await AsyncStorage.setItem(key, JSON.stringify({ version: 1, data: { groups: 'nope' } }));
    expect(await loadAppData()).toEqual({ status: 'corrupt' });
  });

  it('reports read failures without throwing', async () => {
    const spy = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk error'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await loadAppData()).toEqual({ status: 'error' });
    spy.mockRestore();
    warn.mockRestore();
  });
});
