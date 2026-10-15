import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { registerAccount, uniquePhone } from "../test/factories.js";

describe("auth routes", () => {
  it("registers a new shop owner and sets a session cookie", async () => {
    const app = createApp();
    const phone = uniquePhone();

    const response = await request(app).post("/api/v1/auth/register").send({
      shopName: "Addis Mini Market",
      displayName: "Marta Tesfaye",
      phone,
      password: "a-strong-password",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        phone: `+251${phone.slice(1)}`,
        displayName: "Marta Tesfaye",
        role: "OWNER",
        shop: { name: "Addis Mini Market" },
      },
    });
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("rejects registration with a phone number already in use", async () => {
    const app = createApp();
    const phone = uniquePhone();

    await registerAccount(app, { phone });
    const response = await request(app).post("/api/v1/auth/register").send({
      shopName: "Second Shop",
      displayName: "Someone Else",
      phone,
      password: "another-password",
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("PHONE_TAKEN");
  });

  it("rejects registration with an invalid phone number", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/auth/register").send({
      shopName: "Shop",
      displayName: "Owner",
      phone: "not-a-phone",
      password: "a-strong-password",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("logs in with correct credentials", async () => {
    const app = createApp();
    const { phone, password } = await registerAccount(app);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ phone, password });

    expect(response.status).toBe(200);
    expect(response.body.data.phone).toBe(`+251${phone.slice(1)}`);
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("rejects login with the wrong password", async () => {
    const app = createApp();
    const { phone } = await registerAccount(app);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ phone, password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects login for an unknown phone number", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ phone: uniquePhone(), password: "whatever-password" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects /auth/me without a session cookie", async () => {
    const app = createApp();

    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("returns the current user with a valid session cookie", async () => {
    const app = createApp();
    const { cookie, phone } = await registerAccount(app);

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.data.phone).toBe(`+251${phone.slice(1)}`);
  });

  it("revokes the session on logout", async () => {
    const app = createApp();
    const { cookie } = await registerAccount(app);

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookie);
    expect(logoutResponse.status).toBe(200);

    const meResponse = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookie);
    expect(meResponse.status).toBe(401);
  });

  it("changes the password and rejects the previous one", async () => {
    const app = createApp();
    const { cookie, phone, password } = await registerAccount(app);

    const changeResponse = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Cookie", cookie)
      .send({ currentPassword: password, newPassword: "a-new-password" });
    expect(changeResponse.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ phone, password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ phone, password: "a-new-password" });
    expect(newLogin.status).toBe(200);
  });
});
