# SplitEase

**Every expense, fairly split.**

SplitEase is a group expense app for friends, flatmates, couples and travellers. Create a group, add expenses (equal or custom split), see who owes whom, and record settlements. Everything is stored on the device, so no account or server is needed.

Built with Expo SDK 58, React Native 0.88, TypeScript, Expo Router, React Context and AsyncStorage.

## Running it

```bash
npm install
npm start          # then press i (iOS), a (Android) or w (web)
```

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm test`          | Unit and integration tests (Jest)   |
| `npm run typecheck` | TypeScript (`tsc --noEmit`)         |
| `npm run lint`      | ESLint (`expo lint`)                |

On first launch the app seeds demo data with three groups: Goa Trip, Flatmates and Weekend Plans. **Profile → Reset demo data** restores it at any time.

## Project structure

```
app/                     Screens (Expo Router: every file is a route)
  _layout.tsx            Root stack, fonts, providers
  (tabs)/                Home, Groups, Activity, Profile tabs
  groups/create.tsx      Create group
  groups/[id].tsx        Group details: balances, who owes whom, history
  expenses/create.tsx    Add expense (equal / custom split)
  expenses/[id].tsx      Expense details and delete
  settlements/create.tsx Settle up

components/
  common/                AppButton, AppCard, AppInput, Avatar, Chip, EmptyState,
                         FormScreen, ScreenHeader, SectionHeader, Toast, …
  home/                  BalanceCard, QuickActions
  groups/                GroupCard
  expenses/              ExpenseItem, SettlementItem, ActivityList

context/AppContext.tsx   App state and actions (createGroup, addExpense, …)
hooks/                   useApp, useGroupSummaries
services/storage.ts      The only file that talks to AsyncStorage
utils/                   Business logic (pure functions, fully tested)
  money.ts               Rupees ↔ paise, input parsing
  formatCurrency.ts      ₹1,25,000 formatting (Intl, with a fallback)
  expenseCalculator.ts   Equal splits, custom-split validation
  balanceCalculator.ts   Balances, totals, settlement suggestions
  seedData.ts            Demo data
types/index.ts           Data models
constants/               Design tokens (colors, spacing, type) and categories
__tests__/               Jest tests
```

## How the money logic works

**1. No floating-point errors.** In JavaScript, `0.1 + 0.2 !== 0.3`. Amounts are stored in rupees (for example `1845.5`), but all arithmetic converts to **integer paise** first (`toPaise`), does the maths on integers, and converts back.

**2. Equal splits always add up.** ₹100 between 3 people is 10,000 paise ÷ 3 = 3,333 remainder 1. The leftover paise go one each to the first members, giving ₹33.34 + ₹33.33 + ₹33.33 = ₹100.00 (`splitEqually`).

**3. Balances.** For each group (`calculateGroupBalances`):
- Expense: the payer is **credited** the full amount, and each participant is **debited** their share.
- Settlement: the person who paid is **credited**, and the person who received is **debited**.

A positive balance means the member is owed money; negative means they owe. Within a group the balances always sum to exactly zero.

**4. Who owes whom (greedy algorithm).** `generateSettlementSuggestions` sorts debtors and creditors by amount. The biggest debtor pays the biggest creditor as much as possible, whoever reaches zero drops out, and the process repeats. Each step fully settles at least one person, so N people need at most N − 1 payments. These are **suggestions only**. Nothing changes until a settlement is recorded on the Settle Up screen.

**5. Settlement limits.** A payer can't pay more than they owe, and a receiver can't receive more than they're owed (`getMaxSettlementAmount`). This keeps a settlement from flipping anyone's balance.

**6. Dashboard totals.** "You owe" adds up your negative group balances and "You're owed" adds up your positive ones. Net = owed − owe. Nothing is hardcoded; every number is derived from stored expenses and settlements.

## State and persistence

- `AppProvider` holds one `AppData` object: `{ profile, groups, expenses, settlements }`.
- Each action uses a functional `setState` update, so actions that run back to back never overwrite each other.
- Every change is saved as **one JSON snapshot under one AsyncStorage key**. A single write is atomic, so groups and expenses can't get out of sync.
- Saves are queued, so an older snapshot can never land after a newer one.
- On startup:
  - **Saved data** → restored.
  - **Nothing saved** → demo data is seeded.
  - **Corrupted data** → demo data is loaded and the user sees a warning.
  - **Storage unreadable** → demo data is shown, but saving is disabled, so the real data on disk is never overwritten.
- A future backend only needs to replace `services/storage.ts`.

## Demo data balances

| Group         | You        | Others                                          |
| ------------- | ---------- | ----------------------------------------------- |
| Goa Trip      | +₹3,100    | Rahul −₹1,200, Aman −₹1,900                     |
| Flatmates     | +₹1,460.66 | Neha −₹414.84, Karan −₹1,045.82                 |
| Weekend Plans | −₹1,470    | Sneha −₹610, Arjun +₹2,970, Ishaan −₹890        |

Dashboard: you're owed **₹4,560.66**, you owe **₹1,470**, net **+₹3,090.66**. These figures are asserted in `__tests__/seedData.test.ts`.

> **Note on the original brief:** it gave Dinner ₹1,500 (paid by Piyush) and Cab ₹900 (paid by Rahul), both split three ways, with expected balances of Piyush +₹1,000, Rahul +₹600, Aman −₹1,600. Those figures leave out each person's own share of the *other* expense. The correct result is **Piyush +₹700, Rahul +₹100, Aman −₹800** (Piyush paid 1,500 and owes 500 + 300 = 800 → +700). `__tests__/balanceCalculator.test.ts` checks this.

## Testing

63 Jest tests cover:

- **Money**: paise conversion, parsing, Indian number formatting.
- **Splits**: equal splits with remainders (₹1,845.50 ÷ 3, ₹999.99 ÷ 7, …), custom-split validation.
- **Balances**: zero-sum checks, settlements, expense deletion, cross-group isolation, greedy suggestions, settlement limits, dashboard totals.
- **Storage**: save/restore round trip, corrupted data, read failures.
- **Integration** (`__tests__/app.test.tsx`): renders the real screens with Expo Router, then:
  - adds equal and custom-split expenses;
  - blocks invalid splits;
  - deletes an expense and checks the recalculated dashboard;
  - records a settlement and rejects one that's too large;
  - creates a group, including duplicate-name validation;
  - handles unknown route IDs.
