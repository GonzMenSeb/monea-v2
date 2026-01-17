global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

global.__ExpoImportMetaRegistry = new Proxy({}, {
  get: () => undefined,
});

global.structuredClone = global.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)));

jest.mock('expo/src/winter/installGlobal', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('expo/src/winter/runtime.native', () => ({
  __esModule: true,
  default: {},
  require: jest.fn(),
}));
jest.mock('expo', () => ({
  __esModule: true,
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
  },
  NotificationFeedbackType: {
    Success: 'SUCCESS',
    Warning: 'WARNING',
    Error: 'ERROR',
  },
}));
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    Swipeable: ({ children, renderRightActions, renderLeftActions }) => {
      const sharedValue = { value: 0 };
      return (
        <>
          {renderLeftActions && renderLeftActions(sharedValue)}
          {children}
          {renderRightActions && renderRightActions(sharedValue)}
        </>
      );
    },
    GestureHandlerRootView: View,
    PanGestureHandler: View,
    TapGestureHandler: View,
    State: {},
    Directions: {},
  };
});
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'WIFI',
    })
  ),
  NetworkStateType: {
    UNKNOWN: 'UNKNOWN',
    NONE: 'NONE',
    WIFI: 'WIFI',
    CELLULAR: 'CELLULAR',
  },
}));
jest.mock('expo-linking', () => ({
  openSettings: jest.fn(() => Promise.resolve()),
  openURL: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(),
  },
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: 'Stack',
  Tabs: 'Tabs',
  Slot: 'Slot',
}));
jest.mock('@maniac-tech/react-native-expo-read-sms', () => ({
  startReadSMS: jest.fn(),
  checkIfHasSMSPermission: jest.fn(),
  requestReadSMSPermission: jest.fn(),
}));
jest.mock('@nozbe/watermelondb/adapters/sqlite', () => {
  const mockAdapter = jest.fn().mockImplementation(() => ({
    schema: {},
    migrations: [],
  }));
  return {
    SQLiteAdapter: mockAdapter,
    default: mockAdapter,
  };
});
jest.mock('@/infrastructure/database', () => ({
  database: {
    write: jest.fn(),
    read: jest.fn(),
    get: jest.fn(),
    collections: {
      get: jest.fn(),
    },
  },
  AccountRepository: jest.fn(),
  TransactionRepository: jest.fn(),
  Account: class Account {},
  Transaction: class Transaction {},
  Category: class Category {},
  SmsMessage: class SmsMessage {},
}));
jest.mock('react-native-reanimated', () => {
  const { View, Text, Pressable } = require('react-native');

  const createMockAnimatedComponent = (Component) => {
    const AnimatedComponent = (props) => <Component {...props} />;
    AnimatedComponent.displayName = `Animated(${Component.displayName || Component.name || 'Component'})`;
    return AnimatedComponent;
  };

  const mockAnimated = {
    View: createMockAnimatedComponent(View),
    Text: createMockAnimatedComponent(Text),
    createAnimatedComponent: createMockAnimatedComponent,
  };

  return {
    __esModule: true,
    default: mockAnimated,
    useSharedValue: (initialValue) => ({ value: initialValue }),
    useAnimatedStyle: (styleFactory) => styleFactory(),
    withSpring: (toValue) => toValue,
    withTiming: (toValue, config, callback) => {
      if (callback) callback(true);
      return toValue;
    },
    withRepeat: (animation) => animation,
    withSequence: (...animations) => animations[animations.length - 1],
    withDelay: (delay, animation) => animation,
    interpolate: (value, inputRange, outputRange) => {
      if (typeof value !== 'number') return outputRange[0];
      const inputMin = inputRange[0];
      const inputMax = inputRange[inputRange.length - 1];
      const outputMin = outputRange[0];
      const outputMax = outputRange[outputRange.length - 1];
      if (value <= inputMin) return outputMin;
      if (value >= inputMax) return outputMax;
      const ratio = (value - inputMin) / (inputMax - inputMin);
      return outputMin + ratio * (outputMax - outputMin);
    },
    interpolateColor: (progress, input, output) => output[Math.round(progress)] || 'transparent',
    Extrapolate: { CLAMP: 'clamp' },
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      bezier: () => (t) => t,
      in: (fn) => fn,
      out: (fn) => fn,
      inOut: (fn) => fn,
    },
    runOnJS: (fn) => fn,
    createAnimatedComponent: createMockAnimatedComponent,
  };
});
