import { Alert, Platform } from 'react-native';

/**
 * Route params can be a string, an array of strings, or missing
 * (e.g. a broken deep link). This always gives back a single string or undefined.
 */
export function getParam(value: string | string[] | undefined): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  return single && single.trim() ? single : undefined;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  destructive?: boolean;
}

/**
 * Shows a native confirmation dialog and resolves to true if the user confirms.
 * React Native's Alert has no buttons on web, so we fall back to window.confirm there.
 */
export function confirmAction({ title, message, confirmText, destructive }: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
