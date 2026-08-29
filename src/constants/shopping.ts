import type { CategoryColor, ListColor } from '@prisma/client';

import type { ColorTheme, ListColorTheme } from '@/types/shopping';

/* -- Emoji icons available in the category picker -- */
export const CATEGORY_ICONS = [
  '🥬',
  '🥛',
  '🥩',
  '🍞',
  '🍪',
  '🥜',
  '🧊',
  '🧃',
  '🧱',
  '🍩',
  '🥐',
  '🥗',
] as const;

/* -- Color theme config -- */

export const COLOR_THEMES: Record<CategoryColor, ColorTheme> = {
  GREEN: {
    label: 'Green',
    bg: 'bg-green-50',
    bar: 'bg-green-500',
    border: 'border-green-200',
    text: 'text-green-600',
    pill: 'bg-green-100 hover:bg-green-200',
    pillText: 'text-green-700',
  },
  BLUE: {
    label: 'Blue',
    bg: 'bg-blue-50',
    bar: 'bg-blue-500',
    border: 'border-blue-200',
    text: 'text-blue-600',
    pill: 'bg-blue-100 hover:bg-blue-200',
    pillText: 'text-blue-700',
  },
  RED: {
    label: 'Red',
    bg: 'bg-red-50',
    bar: 'bg-red-500',
    border: 'border-red-200',
    text: 'text-red-600',
    pill: 'bg-red-100 hover:bg-red-200',
    pillText: 'text-red-700',
  },
  ORANGE: {
    label: 'Orange',
    bg: 'bg-orange-50',
    bar: 'bg-orange-500',
    border: 'border-orange-200',
    text: 'text-orange-600',
    pill: 'bg-orange-100 hover:bg-orange-200',
    pillText: 'text-orange-700',
  },
  YELLOW: {
    label: 'Yellow',
    bg: 'bg-yellow-50',
    bar: 'bg-yellow-400',
    border: 'border-yellow-200',
    text: 'text-yellow-600',
    pill: 'bg-yellow-100 hover:bg-yellow-200',
    pillText: 'text-yellow-700',
  },
  PURPLE: {
    label: 'Purple',
    bg: 'bg-purple-50',
    bar: 'bg-purple-500',
    border: 'border-purple-200',
    text: 'text-purple-600',
    pill: 'bg-purple-100 hover:bg-purple-200',
    pillText: 'text-purple-700',
  },
  INDIGO: {
    label: 'Indigo',
    bg: 'bg-indigo-50',
    bar: 'bg-indigo-500',
    border: 'border-indigo-200',
    text: 'text-indigo-600',
    pill: 'bg-indigo-100 hover:bg-indigo-200',
    pillText: 'text-indigo-700',
  },
  GRAY: {
    label: 'Gray',
    bg: 'bg-gray-50',
    bar: 'bg-gray-400',
    border: 'border-gray-200',
    text: 'text-gray-600',
    pill: 'bg-gray-100 hover:bg-gray-200',
    pillText: 'text-gray-700',
  },
};

export const CATEGORY_COLORS = Object.keys(COLOR_THEMES) as CategoryColor[];

/* -- Shopping list color config -- */

export const LIST_COLOR_THEMES: Record<ListColor, ListColorTheme> = {
  PRIMARY: {
    label: 'Primary',
    solid: 'bg-green-600',
    dot: 'bg-green-500',
    pillText: 'text-white',
  },
  SECONDARY: {
    label: 'Secondary',
    solid: 'bg-orange-500',
    dot: 'bg-orange-500',
    pillText: 'text-white',
  },
  GREEN: {
    label: 'Green',
    solid: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    pillText: 'text-white',
  },
  BLUE: {
    label: 'Blue',
    solid: 'bg-blue-600',
    dot: 'bg-blue-500',
    pillText: 'text-white',
  },
  PURPLE: {
    label: 'Purple',
    solid: 'bg-purple-600',
    dot: 'bg-purple-500',
    pillText: 'text-white',
  },
  ORANGE: {
    label: 'Orange',
    solid: 'bg-orange-600',
    dot: 'bg-orange-600',
    pillText: 'text-white',
  },
  PINK: {
    label: 'Pink',
    solid: 'bg-pink-500',
    dot: 'bg-pink-500',
    pillText: 'text-white',
  },
  INDIGO: {
    label: 'Indigo',
    solid: 'bg-indigo-600',
    dot: 'bg-indigo-500',
    pillText: 'text-white',
  },
};

export const LIST_COLORS = Object.keys(LIST_COLOR_THEMES) as ListColor[];
