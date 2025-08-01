/**
 * Redis Mock for Testing
 */

const redisMock = {
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    flushall: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    isReady: true,
    isOpen: true
  }))
};

module.exports = redisMock;
