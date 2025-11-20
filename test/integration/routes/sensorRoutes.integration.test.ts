import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as sensorController from "@controllers/sensorController";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@services/authService");
jest.mock("@controllers/sensorController");

describe("SensorRoutes integration", () => {
  const token = "Bearer faketoken";
  const networkCode = "net-1";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const sensorMac = "11:22:33:44:55:66";
  const baseSensorUrl = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET /sensors - get all sensors", async () => {
    const mockSensors = [{ macAddress: sensorMac, name: "Test Sensor" }];
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getAllSensors as jest.Mock).mockResolvedValue(mockSensors);

    const res = await request(app)
      .get(baseSensorUrl)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockSensors);
    expect(sensorController.getAllSensors).toHaveBeenCalledWith(networkCode, gatewayMac);
  });

  it("POST /sensors - create sensor", async () => {
    const sensorBody = {
      macAddress: sensorMac,
      name: "New Sensor",
      variable: "temp",
      unit: "°C"
    };
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .post(baseSensorUrl)
      .set("Authorization", token)
      .send(sensorBody);

    expect(res.status).toBe(201);
    expect(sensorController.createSensor).toHaveBeenCalledWith(networkCode, gatewayMac, sensorBody);
  });

  it("GET /sensors/:sensorMac - get one sensor", async () => {
    const mockSensor = { macAddress: sensorMac, name: "Test Sensor" };
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getSensorByMacAddress as jest.Mock).mockResolvedValue(mockSensor);

    const res = await request(app)
      .get(`${baseSensorUrl}/${sensorMac}`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.macAddress).toEqual(sensorMac);
  });

  it("PATCH /sensors/:sensorMac - update sensor", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);

    const updatedSensor = {
      macAddress: sensorMac,
      name: "Updated Sensor",
      variable: "humidity",
      unit: "%"
    };

    const res = await request(app)
      .patch(`${baseSensorUrl}/${sensorMac}`)
      .set("Authorization", token)
      .send(updatedSensor);

    expect(res.status).toBe(204);
    expect(sensorController.updateSensor).toHaveBeenCalledWith(networkCode, gatewayMac, sensorMac, updatedSensor);
  });

  it("DELETE /sensors/:sensorMac - delete sensor", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.deleteSensor as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .delete(`${baseSensorUrl}/${sensorMac}`)
      .set("Authorization", token);

    expect(res.status).toBe(204);
    expect(sensorController.deleteSensor).toHaveBeenCalledWith(networkCode, gatewayMac, sensorMac);
  });

  it("401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token");
    });

    const res = await request(app).get(baseSensorUrl).set("Authorization", "Bearer bad");
    expect(res.status).toBe(401);
  });

  it("403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden");
    });

    const res = await request(app).get(baseSensorUrl).set("Authorization", token);
    expect(res.status).toBe(403);
  });
});