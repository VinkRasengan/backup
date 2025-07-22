/**
 * Firebase Admin Mock for Testing
 */

const firebaseMock = {
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
    applicationDefault: jest.fn()
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ test: 'data' })
        }),
        set: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({})
      })),
      add: jest.fn().mockResolvedValue({ id: 'mock-id' }),
      where: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          docs: []
        })
      }))
    }))
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'mock-uid',
      email: 'test@example.com'
    }),
    getUser: jest.fn().mockResolvedValue({
      uid: 'mock-uid',
      email: 'test@example.com'
    })
  }))
};

module.exports = firebaseMock;
