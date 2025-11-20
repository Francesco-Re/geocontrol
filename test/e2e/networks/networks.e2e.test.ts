import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("GET /networks (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should return an empty array when no networks exist", async () => {
    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`);


    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it("should require authentication", async () => {
    const res = await request(app).get("/api/v1/networks");
    expect(res.status).toBe(401);
  });
});
//npm test -- test/e2e/networks/networks.e2e.test.ts