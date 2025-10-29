process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_key";

// Force fetch to be a jest mock for predictable tests (Node 18+ has fetch natively)
global.fetch = jest.fn(async () => ({
  ok: true,
  json: async () => ({}),
  text: async () => '',
  arrayBuffer: async () => new ArrayBuffer(0),
  headers: new Map([["content-type", "application/json"]])
}));


