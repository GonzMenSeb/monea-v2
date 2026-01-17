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
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(() => ({
    write: jest.fn(),
    read: jest.fn(),
  })),
  Model: class Model {},
  tableSchema: jest.fn(),
  appSchema: jest.fn(),
  associations: jest.fn(() => []),
}));
jest.mock('@nozbe/watermelondb/decorators', () => ({
  field: () => () => {},
  date: () => () => {},
  readonly: () => () => {},
  text: () => () => {},
  children: () => () => {},
  relation: () => () => {},
  immutableRelation: () => () => {},
  lazy: () => () => {},
  action: () => () => {},
  writer: () => () => {},
}));
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
