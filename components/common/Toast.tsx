import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing, typography } from '@/constants/theme';

type ToastType = 'success' | 'error';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

const ToastContext = createContext<(text: string, type?: ToastType) => void>(() => {});

/** Shows a short message at the top of the screen, e.g. "Expense added". */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const counter = useRef(0);

  const showToast = useCallback((text: string, type: ToastType = 'success') => {
    counter.current += 1;
    setToast({ id: counter.current, text, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && <ToastView key={toast.id} toast={toast} onHide={hideToast} />}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onHide }: { toast: ToastMessage; onHide: () => void }) {
  const insets = useSafeAreaInsets();
  // useState (not useRef) keeps one Animated.Value for the component's lifetime.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.spring(progress, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.delay(2200),
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => finished && onHide());
    return () => animation.stop();
  }, [progress, onHide]);

  const Icon = toast.type === 'success' ? CircleCheck : CircleAlert;
  const iconColor = toast.type === 'success' ? colors.positive : colors.negative;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          top: insets.top + spacing.sm,
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        },
      ]}
    >
      <Icon size={20} color={iconColor} strokeWidth={2.2} />
      <Text style={styles.text}>{toast.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.text,
    ...shadows.raised,
  },
  text: {
    ...typography.bodyMedium,
    color: colors.white,
    flex: 1,
  },
});
