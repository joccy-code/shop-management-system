import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe("health routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns process health without querying the database", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "ok",
        service: "shop-manager-api",
        appName: "Shop Manager",
        currency: "ETB",
        timezone: "Africa/Addis_Ababa",
      },
    });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("returns ready when the database responds", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);
    const app = createApp();

    const response = await request(app).get("/api/v1/ready");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "ready",
        database: "up",
      },
    });
  });

  it("returns not ready when the database is unavailable", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(
      new Error("connection refused"),
    );
    const app = createApp();

    const response = await request(app).get("/api/v1/ready");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "NOT_READY",
      },
    });
  });
});
