import {
  BedDouble,
  Car,
  Clapperboard,
  Heart,
  House,
  LucideIcon,
  Plane,
  Receipt,
  Shapes,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Utensils,
  Zap,
} from 'lucide-react-native';

import { ExpenseCategory, GroupCategory } from '@/types';

interface CategoryMeta<T extends string> {
  key: T;
  label: string;
  icon: LucideIcon;
  color: string;
  background: string;
}

export const GROUP_CATEGORIES: CategoryMeta<GroupCategory>[] = [
  { key: 'trip', label: 'Trip', icon: Plane, color: '#2F80ED', background: '#EAF2FD' },
  { key: 'home', label: 'Home', icon: House, color: '#6857E8', background: '#EFEDFD' },
  { key: 'couple', label: 'Couple', icon: Heart, color: '#E2557D', background: '#FCEBF0' },
  { key: 'friends', label: 'Friends', icon: Sparkles, color: '#E5A23B', background: '#FDF4E6' },
  { key: 'other', label: 'Other', icon: Shapes, color: '#5B6475', background: '#EEF0F4' },
];

export const EXPENSE_CATEGORIES: CategoryMeta<ExpenseCategory>[] = [
  { key: 'food', label: 'Food', icon: Utensils, color: '#E5793B', background: '#FDF0E7' },
  { key: 'groceries', label: 'Groceries', icon: ShoppingCart, color: '#16A36A', background: '#E7F6EF' },
  { key: 'travel', label: 'Travel', icon: Car, color: '#2F80ED', background: '#EAF2FD' },
  { key: 'stay', label: 'Stay', icon: BedDouble, color: '#8B5CF6', background: '#F3EEFE' },
  { key: 'bills', label: 'Bills', icon: Zap, color: '#E5A23B', background: '#FDF4E6' },
  { key: 'entertainment', label: 'Fun', icon: Clapperboard, color: '#E2557D', background: '#FCEBF0' },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#0EA5A4', background: '#E5F6F6' },
  { key: 'other', label: 'Other', icon: Receipt, color: '#5B6475', background: '#EEF0F4' },
];

export function getGroupCategory(key: GroupCategory) {
  return GROUP_CATEGORIES.find((c) => c.key === key) ?? GROUP_CATEGORIES[GROUP_CATEGORIES.length - 1];
}

export function getExpenseCategory(key: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}
