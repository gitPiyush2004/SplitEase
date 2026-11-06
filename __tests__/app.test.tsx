/**
 * End-to-end style tests: they render the real Expo Router screens with the
 * real AppProvider and AsyncStorage (in-memory mock), then drive the UI.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Alert, AlertButton } from 'react-native';

import { AppData } from '@/types';
import { createSeedData } from '@/utils/seedData';

const STORAGE_KEY = '@splitease/data';

async function readStoredData(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return JSON.parse(raw ?? '{}').data;
}

/**
 * Lets pending promises (the save queue) finish, then checks storage.
 * (A polling waitFor with an async callback doesn't mix well with the
 * fake timers renderRouter installs.)
 */
async function waitForStored(check: (data: AppData) => boolean) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await act(async () => {});
    if (check(await readStoredData())) return;
  }
  throw new Error('Expected data was never saved to storage');
}

/** Simulates tapping the confirm (last) button of the next native Alert. */
function autoConfirmAlerts() {
  return jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons?: AlertButton[]) => {
    buttons?.[buttons.length - 1]?.onPress?.();
  });
}

/** Renders the whole app at `url` and waits for saved data to load. */
async function openApp(url = '/') {
  const result = await renderRouter('./app', { initialUrl: url });
  // Wait for fonts and saved data to finish loading.
  await waitFor(() => expect(screen.queryByText('Loading your expenses…')).toBeNull(), { timeout: 5000 });
  return result;
}

beforeEach(async () => {
  // Note: no jest.restoreAllMocks() here — it would undo expo-router's own test mocks.
  await AsyncStorage.clear();
});

describe('Home dashboard', () => {
  it('seeds demo data on first launch and shows calculated balances', async () => {
    await openApp('/');
    expect(await screen.findByText('+₹3,090.66')).toBeTruthy(); // net balance
    expect(screen.getByText('₹4,560.66')).toBeTruthy(); // you're owed
    expect(screen.getAllByText('₹1,470').length).toBeGreaterThan(0); // you owe (also shown on the Weekend Plans card)
    expect(screen.getByText('Goa Trip')).toBeTruthy();
    await waitForStored((data) => data.groups.length === 3);
  });

  it('restores saved data instead of re-seeding', async () => {
    const data = createSeedData();
    data.groups = data.groups.filter((g) => g.id === 'grp_goa');
    data.expenses = data.expenses.filter((e) => e.groupId === 'grp_goa');
    data.settlements = data.settlements.filter((s) => s.groupId === 'grp_goa');
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data }));

    await openApp('/');
    expect(await screen.findByText('+₹3,100')).toBeTruthy();
    expect(screen.queryByText('Flatmates')).toBeNull();
  });
});

describe('Add expense', () => {
  it('adds an equal split and updates balances immediately', async () => {
    const router = await openApp('/expenses/create?groupId=grp_goa');

    await fireEvent.changeText(screen.getByLabelText('Amount in rupees'), '300');
    await fireEvent.changeText(screen.getByPlaceholderText('e.g. Dinner at beach cafe'), 'Snacks');
    expect(screen.getAllByText('₹100')).toHaveLength(3); // live equal-split preview
    await fireEvent.press(screen.getByText('Save expense'));

    await waitFor(() => expect(router.getPathname()).toBe('/groups/grp_goa'));
    // You paid ₹300 and owe ₹100 of it → Goa balance goes from +₹3,100 to +₹3,300
    expect((await screen.findAllByText('₹3,300')).length).toBeGreaterThan(0);

    await waitForStored((data) => {
      const snack = data.expenses.find((e) => e.title === 'Snacks');
      return !!snack && snack.participants.every((p) => p.shareAmount === 100);
    });
  });

  it('blocks an unequal split that does not add up, then saves once it does', async () => {
    await openApp('/expenses/create?groupId=grp_goa');

    await fireEvent.changeText(screen.getByLabelText('Amount in rupees'), '1500');
    await fireEvent.changeText(screen.getByPlaceholderText('e.g. Dinner at beach cafe'), 'Shopping');
    await fireEvent.press(screen.getByText('Custom amounts'));

    await fireEvent.changeText(screen.getByLabelText('Share for You'), '700');
    await fireEvent.changeText(screen.getByLabelText('Share for Rahul Sharma'), '500');
    await fireEvent.changeText(screen.getByLabelText('Share for Aman Verma'), '200');
    expect(screen.getByText('₹100 left to assign')).toBeTruthy();

    await fireEvent.press(screen.getByText('Save expense'));
    expect(await screen.findByText('Shares must add up to the total amount.')).toBeTruthy();
    await waitForStored((data) => !data.expenses.some((e) => e.title === 'Shopping'));

    await fireEvent.changeText(screen.getByLabelText('Share for Aman Verma'), '300');
    expect(screen.getByText('All ₹1,500 assigned')).toBeTruthy();
    await fireEvent.press(screen.getByText('Save expense'));

    await waitForStored((data) => {
      const expense = data.expenses.find((e) => e.title === 'Shopping');
      return expense?.splitType === 'unequal' && expense.participants.map((p) => p.shareAmount).join() === '700,500,300';
    });
  });

  it('shows validation errors for an empty form', async () => {
    await openApp('/expenses/create');
    await fireEvent.press(screen.getByText('Save expense'));
    expect(await screen.findByText('Enter an amount greater than ₹0.')).toBeTruthy();
    expect(screen.getByText('Add a short description, like "Dinner".')).toBeTruthy();
  });
});

describe('Expense details', () => {
  it('deletes an expense after confirmation and recalculates balances', async () => {
    const alert = autoConfirmAlerts();
    await openApp('/expenses/exp_goa_dinner');

    expect(await screen.findByText('Dinner at beach cafe')).toBeTruthy();
    await fireEvent.press(screen.getByText('Delete expense'));
    expect(alert).toHaveBeenCalled();

    await waitForStored((data) => !data.expenses.some((e) => e.id === 'exp_goa_dinner'));
    alert.mockRestore();
    await renderRouter('./app', { initialUrl: '/' });
    // Goa: +₹3,100 − ₹1,000 lent on dinner = +₹2,100 → net +₹2,090.66
    expect(await screen.findByText('+₹2,090.66')).toBeTruthy();
  });

  it('handles an unknown expense id gracefully', async () => {
    await openApp('/expenses/does-not-exist');
    expect(await screen.findByText('Expense not found')).toBeTruthy();
  });
});

describe('Settle up', () => {
  it('pre-fills the largest debt and records the settlement', async () => {
    const router = await openApp('/settlements/create?groupId=grp_goa');

    // Goa balances: You +3,100, Rahul −1,200, Aman −1,900 → Aman pays you ₹1,900 first
    expect(await screen.findByDisplayValue('1900')).toBeTruthy();
    await fireEvent.press(screen.getByText('Record settlement'));

    await waitFor(() => expect(router.getPathname()).toBe('/groups/grp_goa'));
    expect((await screen.findAllByText('₹1,200')).length).toBeGreaterThan(0);
    await waitForStored((data) =>
      data.settlements.some((s) => s.fromMemberId === 'mem_goa_aman' && s.amount === 1900 && s.id !== 'set_goa_aman'),
    );
  });

  it('rejects amounts above what is outstanding', async () => {
    await openApp('/settlements/create?groupId=grp_goa&from=mem_goa_aman&to=me&amount=1900');
    await fireEvent.changeText(await screen.findByDisplayValue('1900'), '5000');
    await fireEvent.press(screen.getByText('Record settlement'));
    expect(await screen.findByText('Amount is more than what is outstanding.')).toBeTruthy();
  });
});

describe('Create group', () => {
  it('validates, creates the group and opens it', async () => {
    const router = await openApp('/groups/create');

    await fireEvent.press(screen.getByText('Create group'));
    expect(await screen.findByText('Give your group a name.')).toBeTruthy();
    expect(screen.getByText('Add at least one other member.')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('e.g. Goa Trip'), 'Manali Trip');
    await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Rahul');
    await fireEvent.press(screen.getByText('Add member'));
    await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'rahul');
    await fireEvent.press(screen.getByText('Add member'));
    expect(await screen.findByText('rahul is already in this group.')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Neha');
    await fireEvent.press(screen.getByText('Create group'));

    await waitFor(() => expect(router.getPathname()).toMatch(/^\/groups\/grp_/));
    expect(await screen.findByText('Everyone in this group is settled up.')).toBeTruthy();
    await waitForStored((data) => {
      const group = data.groups.find((g) => g.name === 'Manali Trip');
      return group?.members.map((m) => m.name).join() === 'Piyush Bhatia,Rahul,Neha';
    });
  });

  it('shows a not-found state for unknown group ids', async () => {
    await openApp('/groups/unknown');
    expect(await screen.findByText('Group not found')).toBeTruthy();
  });
});
