import { useContext } from 'react';

import { AppContext, AppContextValue } from '@/context/AppContext';

/** Access app data and actions from any screen or component. */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside <AppProvider>.');
  }
  return context;
}
