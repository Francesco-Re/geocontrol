import { MeasurementRepository } from "@repositories/MeasurementRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(MeasurementDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("MeasurementRepository: SQLite in-memory", () => {
  const repo = new MeasurementRepository();
  const sensorMac = "sensor-mac-1";
  const gatewayMac = "gw-mac-1";
  const networkCode = "net-1";
  const createdAt = new Date("2025-05-30T12:00:00Z");
  const value = 42.5;

  async function createNetworkGatewaySensor() {
    // Create a network
    const network = TestDataSource.getRepository(NetworkDAO).create({
      code: networkCode,
      name: "Test Network",
      description: "A test network"
    });
    await TestDataSource.getRepository(NetworkDAO).save(network);
    // Create a gateway
    const gateway = TestDataSource.getRepository(GatewayDAO).create({
      macAdress: gatewayMac,
      name: "Test Gateway",
      description: "A test gateway",
      network: network
    });
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    // Create a sensor
    const sensor = TestDataSource.getRepository(SensorDAO).create({
      macAddress: sensorMac,
      name: "Test Sensor",
      description: "A test sensor",
      variable: "temperature",
      unit: "C",
      gateway: gateway
    });
    await TestDataSource.getRepository(SensorDAO).save(sensor);
    return sensor;
  }

  it("create measurement", async () => {
    await createNetworkGatewaySensor();
    const measurement = await repo.createMeasurement(networkCode, gatewayMac, sensorMac, createdAt, value);
    expect(measurement).toMatchObject({
      createdAt: createdAt.toISOString(),
      value: value,
      isOutlier: false
    });
    const found = await TestDataSource.getRepository(MeasurementDAO).findOne({
      where: { sensorMacAddress: sensorMac, createdAt: createdAt }
    });
    expect(found).toBeTruthy();
    expect(found.value).toBe(value);
  });

  it("find measurement by sensor: not found", async () => {
    await expect(
      repo.getAllSensorMeasurements(networkCode, gatewayMac, sensorMac, createdAt, createdAt)
    ).rejects.toThrow(NotFoundError);
  });

  it("create measurement: conflict", async () => {
    await createNetworkGatewaySensor();
    await repo.createMeasurement(networkCode, gatewayMac, sensorMac, createdAt, value);
    await expect(
      repo.createMeasurement(networkCode, gatewayMac, sensorMac, createdAt, value)
    ).rejects.toThrow(ConflictError);
  });
});
