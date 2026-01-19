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
jest.mock('tamagui', () => {
  const { View, Text, TextInput, ScrollView, Pressable } = require('react-native');
  const React = require('react');

  const createMockComponent = (displayName) => {
    const Component = React.forwardRef(({ children, ...props }, ref) => {
      return React.createElement(View, { ...props, ref }, children);
    });
    Component.displayName = displayName;
    return Component;
  };

  const createMockTextComponent = (displayName) => {
    const Component = React.forwardRef(({ children, ...props }, ref) => {
      return React.createElement(Text, { ...props, ref }, children);
    });
    Component.displayName = displayName;
    return Component;
  };

  const styled = (Component, config) => {
    const StyledComponent = React.forwardRef((props, ref) => {
      const { children, ...rest } = props;
      return React.createElement(Component, { ...rest, ref }, children);
    });
    StyledComponent.displayName = config?.name || 'StyledComponent';
    return StyledComponent;
  };

  return {
    styled,
    Stack: createMockComponent('Stack'),
    XStack: createMockComponent('XStack'),
    YStack: createMockComponent('YStack'),
    ZStack: createMockComponent('ZStack'),
    Text: createMockTextComponent('Text'),
    Paragraph: createMockTextComponent('Paragraph'),
    H1: createMockTextComponent('H1'),
    H2: createMockTextComponent('H2'),
    H3: createMockTextComponent('H3'),
    H4: createMockTextComponent('H4'),
    H5: createMockTextComponent('H5'),
    H6: createMockTextComponent('H6'),
    SizableText: createMockTextComponent('SizableText'),
    Heading: createMockTextComponent('Heading'),
    Label: createMockTextComponent('Label'),
    Button: React.forwardRef(({ children, onPress, ...props }, ref) => {
      return React.createElement(Pressable, { onPress, accessibilityRole: 'button', ...props, ref },
        typeof children === 'string' ? React.createElement(Text, null, children) : children
      );
    }),
    Input: React.forwardRef((props, ref) => React.createElement(TextInput, { ...props, ref })),
    TextArea: React.forwardRef((props, ref) => React.createElement(TextInput, { multiline: true, ...props, ref })),
    Card: createMockComponent('Card'),
    Image: createMockComponent('Image'),
    Avatar: createMockComponent('Avatar'),
    Circle: createMockComponent('Circle'),
    Square: createMockComponent('Square'),
    Separator: createMockComponent('Separator'),
    Spinner: createMockComponent('Spinner'),
    ScrollView: React.forwardRef((props, ref) => React.createElement(ScrollView, { ...props, ref })),
    Switch: createMockComponent('Switch'),
    Checkbox: createMockComponent('Checkbox'),
    RadioGroup: createMockComponent('RadioGroup'),
    Select: createMockComponent('Select'),
    Sheet: createMockComponent('Sheet'),
    Dialog: createMockComponent('Dialog'),
    Popover: createMockComponent('Popover'),
    Tooltip: createMockComponent('Tooltip'),
    useTheme: () => ({
      background: '#000',
      backgroundBase: '#0a0a0a',
      backgroundSurface: '#1a1a1a',
      color: '#fff',
      textPrimary: '#fff',
      textSecondary: '#888',
      accentPrimary: '#007AFF',
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
    }),
    useMedia: () => ({ sm: false, md: false, lg: true }),
    Theme: ({ children }) => children,
    TamaguiProvider: ({ children }) => children,
    createTamagui: (config) => config,
    createTokens: (tokens) => tokens,
    createThemes: (themes) => themes,
    createFont: (font) => font,
    createMedia: (media) => media,
    getTokens: () => ({}),
    getToken: () => '',
    View: createMockComponent('View'),
    AnimatePresence: ({ children }) => children,
    createAnimations: () => ({}),
    isWeb: false,
  };
});
jest.mock('react-native-gifted-charts', () => ({
  BarChart: () => null,
  LineChart: () => null,
  PieChart: () => null,
}));
jest.mock('victory-native', () => ({
  CartesianChart: ({ children }) => {
    const React = require('react');
    return children ? children({ points: { income: [], expense: [] }, chartBounds: {} }) : null;
  },
  Bar: () => null,
  useChartPressState: () => ({
    state: {
      x: { position: { value: 0 } },
      y: { income: { position: { value: 0 } }, expense: { position: { value: 0 } } },
    },
    isActive: false,
  }),
}), { virtual: true });
jest.mock('@shopify/react-native-skia', () => ({
  Circle: () => null,
  Canvas: ({ children }) => children,
  Path: () => null,
  Skia: { Path: { Make: () => ({}) } },
}), { virtual: true });
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
