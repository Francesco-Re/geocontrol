import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Gateways API (e2e)", () => {
  let adminToken: string;
  let viewerToken: string;

  const networkCode = "NET_GATEWAYS";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";

  beforeAll(async () => {
    await beforeAllE2e();

    adminToken = generateToken(TEST_USERS.admin);
    viewerToken = generateToken(TEST_USERS.viewer);

    // crea la network
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: networkCode,
        name: "GatwayNet",
        description: "Network for gateway tests"
      });

      // crea il gateway
          await request(app)
            .post(`/api/v1/networks/${networkCode}/gateways`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
              macAddress: gatewayMac,
              name: "Main Gateway",
              description: "Primary gateway",
              latitude: 45.0,
              longitude: 9.0
            });
  });
  

  afterAll(async () => {
    await afterAllE2e();
  });

  it("POST /networks/:networkCode/gateways - create new gateway", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
    "macAddress": "94:3F:BE:4C:4A:79",
    "name": "GW01",
    "description": "on-field aggregation node"
});

    expect(res.status).toBe(201);
  });

  it("POST /networks/:networkCode/gateways - viewer should be forbidden", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({name: "GatewayName", macAdress: "00:00:00:00:00:00", description: "Test Gateway"});

    expect(res.status).toBe(403);
  });

  it("GET /networks/:networkCode/gateways - get gateways", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /networks/:networkCode/gateways/:gatewayMac - get a gateway", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
