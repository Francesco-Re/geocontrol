import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Measurements API (e2e)", () => {
  let adminToken: string;
  let viewerToken: string;

  const networkCode = "NET_MEASUREMENT";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const sensorMac = "11:22:33:44:55:66";

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
        name: "MeasurementNet",
        description: "Network for measurements tests"
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

    // crea il sensor
    const sensorRes = await request(app)
    .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
        macAddress: sensorMac,
        name: "Test Sensor",
        description: "Sensor for measurement tests",
        variable: "temperature",
        unit: "°C"
    });

    // console.log("Create sensor status:", sensorRes.status, sensorRes.body);
    // expect(sensorRes.status).toBe(201);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("POST /sensors/:sensorMac/measurements - create new measurements", async () => {
    const measurementsPayload = [
      { value: 25.5, createdAt: "2023-11-15T10:30:00.000Z" },
      { value: 26.1, createdAt: "2023-11-16T14:45:00.000Z" }
    ];

    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(measurementsPayload);

    expect(res.status).toBe(201);
  });

  it("POST /sensors/:sensorMac/measurements - viewer should be forbidden", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send([{ value: 20, createdAt: new Date().toISOString() }]);

    expect(res.status).toBe(403);
  });

  it("GET /sensors/:sensorMac/measurements - get measurements", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.measurements)).toBe(true);
    expect(res.body.sensorMacAddress).toBe(sensorMac);
  });

  it("GET /networks/:networkCode/measurements - get network measurements", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/measurements`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /networks/:networkCode/stats - get network stats", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/stats`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /networks/:networkCode/outliers - get network outliers", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/outliers`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
