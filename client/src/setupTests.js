// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfills for Node.js test environment
if (typeof global !== 'undefined') {
  // TextEncoder/TextDecoder polyfills
  if (!global.TextEncoder) {
    global.TextEncoder = require('util').TextEncoder;
  }
  if (!global.TextDecoder) {
    global.TextDecoder = require('util').TextDecoder;
  }

  // URL polyfills
  if (!global.URL) {
    global.URL = require('url').URL;
  }
  if (!global.URLSearchParams) {
    global.URLSearchParams = require('url').URLSearchParams;
  }

  // Web API polyfills
  if (!global.fetch) {
    global.fetch = require('node-fetch');
  }

  // Mock window object for tests
  if (!global.window) {
    global.window = {
      location: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: ''
      },
      localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      sessionStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };
  }

  // Mock document object
  if (!global.document) {
    global.document = {
      createElement: jest.fn(() => ({
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      })),
      getElementById: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  }

  // Mock navigator object
  if (!global.navigator) {
    global.navigator = {
      userAgent: 'node.js',
      onLine: true,
      language: 'en-US',
      languages: ['en-US', 'en']
    };
  }
}

// Mock Firebase for tests
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({
    currentUser: null
  }))
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn()
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn()
}));

// Mock axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      defaults: { baseURL: 'http://localhost:8080' }
    })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} }))
  },
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    defaults: { baseURL: 'http://localhost:8080' }
  }))
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    form: 'form',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    option: 'option',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
    a: 'a',
    img: 'img',
    ul: 'ul',
    li: 'li'
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  })
}));

// Suppress console warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 