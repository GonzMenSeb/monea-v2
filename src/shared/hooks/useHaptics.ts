import { useCallback } from 'react';

import * as Haptics from 'expo-haptics';

type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

interface UseHapticsReturn {
  trigger: (type?: HapticFeedbackType) => void;
  light: () => void;
  medium: () => void;
  heavy: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
  selection: () => void;
}

const IMPACT_MAP: Record<'light' | 'medium' | 'heavy', Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const NOTIFICATION_MAP: Record<'success' | 'warning' | 'error', Haptics.NotificationFeedbackType> =
  {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  };

export function useHaptics(): UseHapticsReturn {
  const light = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const medium = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const heavy = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const success = useCallback((): void => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const warning = useCallback((): void => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const error = useCallback((): void => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const selection = useCallback((): void => {
    void Haptics.selectionAsync();
  }, []);

  const trigger = useCallback((type: HapticFeedbackType = 'light'): void => {
    switch (type) {
      case 'light':
      case 'medium':
      case 'heavy':
        void Haptics.impactAsync(IMPACT_MAP[type]);
        break;
      case 'success':
      case 'warning':
      case 'error':
        void Haptics.notificationAsync(NOTIFICATION_MAP[type]);
        break;
      case 'selection':
        void Haptics.selectionAsync();
        break;
    }
  }, []);

  return {
    trigger,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
  };
}
