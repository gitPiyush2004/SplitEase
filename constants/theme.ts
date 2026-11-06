import { Platform, TextStyle, ViewStyle } from 'react-native';

/** Design tokens — every screen and component pulls styling from here. */

export const colors = {
  background: '#F7F8FC',
  card: '#FFFFFF',
  primary: '#6857E8',
  primaryDark: '#5443D6',
  primarySoft: '#EFEDFD',
  text: '#192033',
  textSecondary: '#7C8497',
  textMuted: '#A3A9B8',
  positive: '#16A36A',
  positiveSoft: '#E7F6EF',
  negative: '#E25C64',
  negativeSoft: '#FCECED',
  warning: '#E5A23B',
  warningSoft: '#FDF4E6',
  border: '#E9EAF1',
  divider: '#F1F2F7',
  white: '#FFFFFF',
  overlay: 'rgba(25, 32, 51, 0.4)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Horizontal padding used by every screen. */
export const SCREEN_PADDING = spacing.xl;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Typography scale. Spread into StyleSheet styles: `{ ...typography.title }`. */
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  h1: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  bodySemibold: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  captionMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  tiny: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
} satisfies Record<string, TextStyle>;

/** Soft shadows that look consistent on iOS, Android and web. */
export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1B2240',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 1 },
    default: { boxShadow: '0px 4px 14px rgba(27, 34, 64, 0.05)' },
  }),
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#3B2FB0',
      shadowOpacity: 0.25,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 6 },
    default: { boxShadow: '0px 10px 24px rgba(59, 47, 176, 0.25)' },
  }),
};
