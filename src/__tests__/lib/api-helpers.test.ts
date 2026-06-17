import { describe, it, expect, vi } from "vitest";
import {
  ok, created, badRequest, unauthorized, forbidden, notFound,
  conflict, tooMany, serverError, paymentRequired, apiError,
  withErrorHandler, withTimeout,
} from "@/lib/api-helpers";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/auth-config", () => ({ authOptions: {} }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

describe("api-helpers", () => {
  describe("ok", () => {
    it("should return 200 with data wrapped in ok", async () => {
      const res = ok({ message: "hello" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.message).toBe("hello");
    });

    it("should accept custom status code", async () => {
      const res = ok({}, 201);
      expect(res.status).toBe(201);
    });
  });

  describe("created", () => {
    it("should return 201", async () => {
      const res = created({ id: "123" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.id).toBe("123");
    });
  });

  describe("error helpers", () => {
    const cases = [
      { fn: badRequest, status: 400, code: "BAD_REQUEST" },
      { fn: unauthorized, status: 401, code: "UNAUTHORIZED" },
      { fn: forbidden, status: 403, code: "FORBIDDEN" },
      { fn: notFound, status: 404, code: "NOT_FOUND" },
      { fn: conflict, status: 409, code: "CONFLICT" },
      { fn: tooMany, status: 429, code: "RATE_LIMITED" },
      { fn: serverError, status: 500, code: "INTERNAL_ERROR" },
      { fn: paymentRequired, status: 402, code: "PAYMENT_REQUIRED" },
    ] as const;

    for (const { fn, status, code } of cases) {
      it(`${code.toLowerCase()} returns ${status} with code`, async () => {
        const res = fn("test error");
        expect(res.status).toBe(status);
        const body = await res.json();
        expect(body.error).toBe("test error");
        expect(body.code).toBe(code);
      });
    }
  });

  describe("apiError", () => {
    it("should include details when provided", async () => {
      const res = apiError("err", "CODE", 400, { field: "email" });
      const body = await res.json();
      expect(body.details).toEqual({ field: "email" });
    });
  });

  describe("withErrorHandler", () => {
    it("should return handler result on success", async () => {
      const handler = withErrorHandler(async () => ok({ success: true }));
      const res = await handler({ req: new Request("http://test.com"), params: {} });
      expect(res.status).toBe(200);
    });

    it("should catch errors and return 500", async () => {
      const handler = withErrorHandler(async () => { throw new Error("boom"); });
      const res = await handler({ req: new Request("http://test.com"), params: {} });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("withTimeout", () => {
    it("should abort on timeout", async () => {
      const handler = withTimeout(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50000));
        return ok({});
      }, 5);

      const res = await handler({ req: new Request("http://test.com"), params: {} });
      expect(res.status).toBe(408);
      const body = await res.json();
      expect(body.code).toBe("TIMEOUT");
    }, 10000);
  });
});
