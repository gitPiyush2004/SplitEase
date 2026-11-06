import { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingScreen } from '@/components/common/LoadingScreen';
import { loadAppData, saveAppData } from '@/services/storage';
import {
  AppData,
  CURRENT_USER_ID,
  Expense,
  Group,
  GroupCategory,
  Settlement,
  UserProfile,
} from '@/types';
import { generateId } from '@/utils/id';
import { roundMoney } from '@/utils/money';
import { createSeedData } from '@/utils/seedData';

export interface NewGroupInput {
  name: string;
  description: string;
  category: GroupCategory;
  /** Other members — the current user is added automatically. */
  members: { name: string; email: string }[];
}

export type NewExpenseInput = Omit<Expense, 'id' | 'createdAt'>;
export type NewSettlementInput = Omit<Settlement, 'id' | 'createdAt'>;

export interface AppContextValue extends AppData {
  /** Set when loading or saving fails, so the UI can warn the user. */
  storageError: string | null;
  createGroup: (input: NewGroupInput) => Group;
  deleteGroup: (groupId: string) => void;
  addExpense: (input: NewExpenseInput) => Expense;
  deleteExpense: (expenseId: string) => void;
  addSettlement: (input: NewSettlementInput) => Settlement;
  deleteSettlement: (settlementId: string) => void;
  updateProfile: (profile: UserProfile) => void;
  resetDemoData: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // null until saved data has been restored from storage
  const [data, setData] = useState<AppData | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // If storage couldn't be read we must not overwrite whatever is saved there.
  const canPersist = useRef(true);
  // Saves run one after another so an older snapshot never overwrites a newer one.
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());

  // 1. Restore saved data on startup (or seed demo data on first launch).
  useEffect(() => {
    let isMounted = true;

    loadAppData().then((result) => {
      if (!isMounted) return;
      switch (result.status) {
        case 'found':
          setData(result.data);
          break;
        case 'empty':
          setData(createSeedData());
          break;
        case 'corrupt':
          setStorageError('Your saved data could not be read, so demo data was loaded instead.');
          setData(createSeedData());
          break;
        case 'error':
          canPersist.current = false;
          setStorageError('Storage is unavailable. Changes made now will not be saved.');
          setData(createSeedData());
          break;
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Persist every change.
  useEffect(() => {
    if (!data || !canPersist.current) return;
    saveQueue.current = saveQueue.current
      .then(() => saveAppData(data))
      .then((saved) => {
        if (!saved) setStorageError('Your latest changes could not be saved.');
      });
  }, [data]);

  // 3. Actions. Each one uses a functional update so it always works
  //    on the latest state, even if several run back to back.
  const updateData = useCallback((update: (current: AppData) => AppData) => {
    setData((current) => (current ? update(current) : current));
  }, []);

  const createGroup = useCallback(
    (input: NewGroupInput): Group => {
      const now = new Date().toISOString();
      const groupId = generateId('grp');
      const group: Group = {
        id: groupId,
        name: input.name.trim(),
        description: input.description.trim(),
        category: input.category,
        members: [
          { id: CURRENT_USER_ID, name: data?.profile.name ?? 'You', email: data?.profile.email },
          ...input.members.map((member) => ({
            id: generateId('mem'),
            name: member.name.trim(),
            email: member.email.trim() || undefined,
          })),
        ],
        createdAt: now,
      };
      updateData((current) => ({ ...current, groups: [group, ...current.groups] }));
      return group;
    },
    [data?.profile.name, data?.profile.email, updateData],
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      updateData((current) => ({
        ...current,
        groups: current.groups.filter((g) => g.id !== groupId),
        expenses: current.expenses.filter((e) => e.groupId !== groupId),
        settlements: current.settlements.filter((s) => s.groupId !== groupId),
      }));
    },
    [updateData],
  );

  const addExpense = useCallback(
    (input: NewExpenseInput): Expense => {
      const expense: Expense = {
        ...input,
        id: generateId('exp'),
        title: input.title.trim(),
        amount: roundMoney(input.amount),
        createdAt: new Date().toISOString(),
      };
      updateData((current) => ({ ...current, expenses: [expense, ...current.expenses] }));
      return expense;
    },
    [updateData],
  );

  const deleteExpense = useCallback(
    (expenseId: string) => {
      updateData((current) => ({
        ...current,
        expenses: current.expenses.filter((e) => e.id !== expenseId),
      }));
    },
    [updateData],
  );

  const addSettlement = useCallback(
    (input: NewSettlementInput): Settlement => {
      const settlement: Settlement = {
        ...input,
        id: generateId('set'),
        amount: roundMoney(input.amount),
        createdAt: new Date().toISOString(),
      };
      updateData((current) => ({ ...current, settlements: [settlement, ...current.settlements] }));
      return settlement;
    },
    [updateData],
  );

  const deleteSettlement = useCallback(
    (settlementId: string) => {
      updateData((current) => ({
        ...current,
        settlements: current.settlements.filter((s) => s.id !== settlementId),
      }));
    },
    [updateData],
  );

  const updateProfile = useCallback(
    (profile: UserProfile) => {
      const cleaned = { name: profile.name.trim(), email: profile.email.trim() };
      updateData((current) => ({
        ...current,
        profile: cleaned,
        // Keep the current user's member entry in every group in sync.
        groups: current.groups.map((group) => ({
          ...group,
          members: group.members.map((member) =>
            member.id === CURRENT_USER_ID ? { ...member, ...cleaned } : member,
          ),
        })),
      }));
    },
    [updateData],
  );

  const resetDemoData = useCallback(() => {
    updateData(() => createSeedData());
  }, [updateData]);

  const value = useMemo<AppContextValue | null>(
    () =>
      data && {
        ...data,
        storageError,
        createGroup,
        deleteGroup,
        addExpense,
        deleteExpense,
        addSettlement,
        deleteSettlement,
        updateProfile,
        resetDemoData,
      },
    [
      data,
      storageError,
      createGroup,
      deleteGroup,
      addExpense,
      deleteExpense,
      addSettlement,
      deleteSettlement,
      updateProfile,
      resetDemoData,
    ],
  );

  if (!value) {
    return <LoadingScreen />;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
