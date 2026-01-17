global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

jest.mock('expo/src/winter/installGlobal', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('expo/src/winter/runtime.native', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('expo', () => ({
  __esModule: true,
}));
