import { renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { useHaptics } from '../useHaptics';

jest.mock('expo-haptics');

describe('useHaptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('impact feedback', () => {
    it('triggers light impact feedback', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.light();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('triggers medium impact feedback', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.medium();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('triggers heavy impact feedback', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.heavy();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });
  });

  describe('notification feedback', () => {
    it('triggers success notification feedback', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.success();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('triggers warning notification feedback', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.warning();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it('triggers error notification feedback', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.error();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });
  });

  describe('selection feedback', () => {
    it('triggers selection feedback', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.selection();

      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });

  describe('trigger method', () => {
    it('defaults to light impact when no type specified', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.trigger();

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('triggers light impact when type is light', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.trigger('light');

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('triggers medium impact when type is medium', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.trigger('medium');

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('triggers heavy impact when type is heavy', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.trigger('heavy');

      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    it('triggers success notification when type is success', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.trigger('success');

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('triggers warning notification when type is warning', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.trigger('warning');

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      );
    });

    it('triggers error notification when type is error', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.trigger('error');

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    it('triggers selection when type is selection', () => {
      const { result } = renderHook(() => useHaptics());

      result.current.trigger('selection');

      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });
});
