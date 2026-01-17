import { renderHook, act } from '@testing-library/react-native';

import {
  useFadeIn,
  useSlideUp,
  useScale,
  usePressable,
  useStaggeredList,
  useShake,
  usePulse,
} from '../hooks';

describe('Animation Hooks', () => {
  describe('useFadeIn', () => {
    it('returns style, start, and reset functions', () => {
      const { result } = renderHook(() => useFadeIn());

      expect(result.current.style).toBeDefined();
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('accepts custom duration option', () => {
      const { result } = renderHook(() => useFadeIn({ duration: 500 }));

      expect(result.current.style).toBeDefined();
    });

    it('accepts delay option', () => {
      const { result } = renderHook(() => useFadeIn({ delay: 100 }));

      expect(result.current.style).toBeDefined();
    });

    it('can disable autoStart', () => {
      const { result } = renderHook(() => useFadeIn({ autoStart: false }));

      expect(result.current.style).toBeDefined();
    });

    it('start function can be called', () => {
      const { result } = renderHook(() => useFadeIn({ autoStart: false }));

      act(() => {
        result.current.start();
      });

      expect(result.current.style).toBeDefined();
    });

    it('reset function can be called', () => {
      const { result } = renderHook(() => useFadeIn());

      act(() => {
        result.current.reset();
      });

      expect(result.current.style).toBeDefined();
    });
  });

  describe('useSlideUp', () => {
    it('returns style, start, and reset functions', () => {
      const { result } = renderHook(() => useSlideUp());

      expect(result.current.style).toBeDefined();
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('accepts custom fromY option', () => {
      const { result } = renderHook(() => useSlideUp({ fromY: 50 }));

      expect(result.current.style).toBeDefined();
    });

    it('accepts delay option', () => {
      const { result } = renderHook(() => useSlideUp({ delay: 200 }));

      expect(result.current.style).toBeDefined();
    });

    it('can disable autoStart', () => {
      const { result } = renderHook(() => useSlideUp({ autoStart: false }));

      expect(result.current.style).toBeDefined();
    });
  });

  describe('useScale', () => {
    it('returns style, start, and reset functions', () => {
      const { result } = renderHook(() => useScale());

      expect(result.current.style).toBeDefined();
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('accepts custom scale options', () => {
      const { result } = renderHook(() => useScale({ initialScale: 0.5, targetScale: 1.2 }));

      expect(result.current.style).toBeDefined();
    });

    it('can disable autoStart', () => {
      const { result } = renderHook(() => useScale({ autoStart: false }));

      expect(result.current.style).toBeDefined();
    });
  });

  describe('usePressable', () => {
    it('returns style and press handlers', () => {
      const { result } = renderHook(() => usePressable());

      expect(result.current.style).toBeDefined();
      expect(typeof result.current.onPressIn).toBe('function');
      expect(typeof result.current.onPressOut).toBe('function');
    });

    it('accepts custom scale options', () => {
      const { result } = renderHook(() => usePressable({ scalePressed: 0.9, scaleDefault: 1 }));

      expect(result.current.style).toBeDefined();
    });

    it('onPressIn can be called', () => {
      const { result } = renderHook(() => usePressable());

      act(() => {
        result.current.onPressIn();
      });

      expect(result.current.style).toBeDefined();
    });

    it('onPressOut can be called', () => {
      const { result } = renderHook(() => usePressable());

      act(() => {
        result.current.onPressOut();
      });

      expect(result.current.style).toBeDefined();
    });
  });

  describe('useStaggeredList', () => {
    it('returns delay and style functions', () => {
      const { result } = renderHook(() => useStaggeredList(5));

      expect(typeof result.current.getDelayForIndex).toBe('function');
      expect(typeof result.current.getStyleForIndex).toBe('function');
    });

    it('calculates correct delay for index', () => {
      const { result } = renderHook(() => useStaggeredList(5, 100));

      expect(result.current.getDelayForIndex(0)).toBe(0);
      expect(result.current.getDelayForIndex(1)).toBe(100);
      expect(result.current.getDelayForIndex(2)).toBe(200);
    });

    it('returns style for index', () => {
      const { result } = renderHook(() => useStaggeredList(3));

      const style = result.current.getStyleForIndex(1);
      expect(style).toBeDefined();
    });
  });

  describe('useShake', () => {
    it('returns style and trigger function', () => {
      const { result } = renderHook(() => useShake());

      expect(result.current.style).toBeDefined();
      expect(typeof result.current.trigger).toBe('function');
    });

    it('trigger can be called', () => {
      const { result } = renderHook(() => useShake());

      act(() => {
        result.current.trigger();
      });

      expect(result.current.style).toBeDefined();
    });
  });

  describe('usePulse', () => {
    it('returns style and trigger function', () => {
      const { result } = renderHook(() => usePulse());

      expect(result.current.style).toBeDefined();
      expect(typeof result.current.trigger).toBe('function');
    });

    it('trigger can be called', () => {
      const { result } = renderHook(() => usePulse());

      act(() => {
        result.current.trigger();
      });

      expect(result.current.style).toBeDefined();
    });
  });
});
