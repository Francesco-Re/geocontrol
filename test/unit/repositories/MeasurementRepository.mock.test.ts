import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave
    })
  }
}));

describe("MeasurementRepository: mocked database", () => {
  const repo = new MeasurementRepository();
  const sensorMac = "sensor-mac-1";
  const gatewayMac = "gw-mac-1";
  const networkCode = "net-1";
  const createdAt = new Date("2025-05-30T12:00:00Z");
  const value = 42.5;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create measurement", async () => {
    mockFind.mockResolvedValue([]);
    const savedMeasurement = new MeasurementDAO();
    savedMeasurement.sensorMacAddress = sensorMac;
    savedMeasurement.createdAt = createdAt;
    savedMeasurement.value = value;
    savedMeasurement.isOutlier = false;
    mockSave.mockResolvedValue(savedMeasurement);
    const result = await repo.createMeasurement(networkCode, gatewayMac, sensorMac, createdAt, value);
    expect(result).toBeInstanceOf(MeasurementDAO);
    expect(result.sensorMacAddress).toBe(sensorMac);
    expect(result.createdAt).toEqual(createdAt);
    expect(result.value).toBe(value);
    expect(result.isOutlier).toBe(false);
    expect(mockSave).toHaveBeenCalledWith({
      sensor: undefined, // In the mock, sensor relation is not resolved
      createdAt: createdAt.toISOString(),
      value: value,
      isOutlier: false
    });
  });

  it("create measurement: conflict", async () => {
    const existingMeasurement = new MeasurementDAO();
    existingMeasurement.sensorMacAddress = sensorMac;
    existingMeasurement.createdAt = createdAt;
    existingMeasurement.value = value;
    existingMeasurement.isOutlier = false;
    mockFind.mockResolvedValue([existingMeasurement]);
    await expect(
      repo.createMeasurement(networkCode, gatewayMac, sensorMac, createdAt, value)
    ).rejects.toThrow(ConflictError);
  });

  it("getAllSensorMeasurements: not found", async () => {
    mockFind.mockResolvedValue([]);
    await expect(
      repo.getAllSensorMeasurements(networkCode, gatewayMac, sensorMac, createdAt, createdAt)
    ).rejects.toThrow(NotFoundError);
  });

  it("getAllSensorMeasurements: found", async () => {
    const foundMeasurement = new MeasurementDAO();
    foundMeasurement.sensorMacAddress = sensorMac;
    foundMeasurement.createdAt = createdAt;
    foundMeasurement.value = value;
    foundMeasurement.isOutlier = false;
    mockFind.mockResolvedValue([foundMeasurement]);
    const result = await repo.getAllSensorMeasurements(networkCode, gatewayMac, sensorMac, createdAt, createdAt);
    expect(result).toEqual([foundMeasurement]);
  });
});
