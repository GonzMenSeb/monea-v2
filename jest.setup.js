global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

jest.mock('expo/src/winter/installGlobal', () => ({}));
jest.mock('expo/src/winter/runtime.native', () => ({}));
