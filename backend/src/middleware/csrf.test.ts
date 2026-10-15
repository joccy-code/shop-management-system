import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("csrf protection", () => {
  it("rejects a mutating request from a foreign origin", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", "https://evil.example")
      .send({ phone: "0911000000", password: "whatever-password" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_REJECTED");
  });

  it("allows the same request when the app header is present", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", "https://evil.example")
      .set("X-Shop-Manager", "1")
      .send({ phone: "not-a-phone", password: "x" });

    expect(response.status).not.toBe(403);
  });
});
