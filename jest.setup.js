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
