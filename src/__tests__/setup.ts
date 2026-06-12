import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.REDIS_URL = "";
  process.env.AUTH_SECRET = "test-secret-key-for-testing-purposes-only";
});

afterAll(() => {
  // cleanup
});
