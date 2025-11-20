import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Sensors API (e2e)", () => {
  let adminToken: string;
  let viewerToken: string;

  const networkCode = "NET_SENSORS";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const sensorMac = "11:22:33:44:55:66";

  beforeAll(async () => {
    await beforeAllE2e();

    adminToken = generateToken(TEST_USERS.admin);
    viewerToken = generateToken(TEST_USERS.viewer);

    // Create network
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: networkCode,
        name: "SensorsNet",
        description: "Network for sensors e2e tests",
      });

    // Create gateway
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: gatewayMac,
        name: "Main Gateway",
        description: "Primary gateway",
        latitude: 45.0,
        longitude: 9.0,
      });

    // Create initial sensor
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: sensorMac,
        name: "Test Sensor",
        description: "Sensor for sensors e2e tests",
        variable: "temperature",
        unit: "°C",
      });
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  // === POST /sensors ===

  it("POST create sensor - 400 invalid data", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: "", // invalid empty mac
        name: "",
        variable: "",
        unit: "",
      });

    expect(res.status).toBe(400);
  });

  it("POST create sensor - 401 unauthorized (no token)", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .send({
        macAddress: "33:44:55:66:77:88",
        name: "Unauthorized Sensor",
        variable: "pressure",
        unit: "Pa",
      });

    expect(res.status).toBe(401);
  });

  it("POST create sensor - 403 insufficient rights", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        macAddress: "33:44:55:66:77:88",
        name: "Viewer Sensor",
        variable: "pressure",
        unit: "Pa",
      });

    expect(res.status).toBe(403);
  });

  it("POST create sensor - 404 network/gateway not found", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/WRONG_NET/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: "44:55:66:77:88:99",
        name: "No Network",
        variable: "pressure",
        unit: "Pa",
      });

    expect(res.status).toBe(404);
  });

  it("POST create sensor - 409 mac address already used", async () => {
    // sensorMac was created in beforeAll
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: sensorMac,
        name: "Duplicate Sensor",
        variable: "temperature",
        unit: "°C",
      });

    expect(res.status).toBe(409);
  });

  // === GET all sensors ===

  it("GET all sensors - 200 success", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET all sensors - 401 unauthorized", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`);

    expect(res.status).toBe(401);
  });

  it("GET all sensors - 404 network/gateway not found", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/INVALID_NET/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  // === GET single sensor ===

  it("GET sensor by mac - 200 success", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.macAddress).toBe(sensorMac);
  });

  it("GET sensor by mac - 401 unauthorized", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`);

    expect(res.status).toBe(401);
  });

  it("GET sensor by mac - 404 network/gateway/sensor not found", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/NOT_EXIST`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  // === PATCH update sensor ===

  it("PATCH update sensor - 401 unauthorized", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .send({
        name: "No Auth",
      });

    expect(res.status).toBe(401);
  });

  it("PATCH update sensor - 403 insufficient rights", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        name: "No Rights",
      });

    expect(res.status).toBe(403);
  });

  it("PATCH update sensor - 409 mac address already in use", async () => {
    // Create second sensor to test conflict
    const mac2 = "55:66:77:88:99:00";
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: mac2,
        name: "Second Sensor",
        variable: "humidity",
        unit: "%",
      });

    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: mac2, // Trying to set mac address that is taken
      });

    expect(res.status).toBe(409);
  });

  // === DELETE sensor ===

  it("DELETE sensor - 204 no content", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it("DELETE sensor - 403 insufficient rights", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it("DELETE sensor - 404 network/gateway/sensor not found", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/NOT_EXIST`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  // Optionally: Add 500 internal server error tests if your app supports mocking errors
});