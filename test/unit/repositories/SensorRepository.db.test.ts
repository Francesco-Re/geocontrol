import { SensorRepository } from "@repositories/SensorRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
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
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("SensorRepository: SQLite in-memory", () => {
  const repo = new SensorRepository();
  const sensorMac = "11:22:33:44:55:66";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const networkCode = "net-1";
  const name = "Test Sensor";
  const description = "A test sensor";
  const variable = "temperature";
  const unit = "C";

  async function createNetworkAndGateway() {
    const network = TestDataSource.getRepository(NetworkDAO).create({
      code: networkCode,
      name: "Test Network",
      description: "A test network"
    });
    await TestDataSource.getRepository(NetworkDAO).save(network);

    const gateway = TestDataSource.getRepository(GatewayDAO).create({
      macAdress: gatewayMac,
      name: "Test Gateway",
      description: "A test gateway",
      network
    });
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    return gateway;
  }

  async function createSensor(mac: string = sensorMac) {
    const gateway = await createNetworkAndGateway();
    const sensor = TestDataSource.getRepository(SensorDAO).create({
      macAddress: mac,
      name,
      description,
      variable,
      unit,
      gateway
    });
    return await TestDataSource.getRepository(SensorDAO).save(sensor);
  }

  it("create sensor", async () => {
    await createNetworkAndGateway();
    const sensor = await repo.createSensor(
      networkCode,
      gatewayMac,
      sensorMac,
      name,
      description,
      variable,
      unit
    );

    expect(sensor.macAddress).toBe(sensorMac);
    const saved = await TestDataSource.getRepository(SensorDAO).findOneBy({ macAddress: sensorMac });
    expect(saved).toBeTruthy();
    expect(saved.name).toBe(name);
  });

  it("create sensor: conflict", async () => {
    await createNetworkAndGateway();
    await repo.createSensor(
      networkCode,
      gatewayMac,
      sensorMac,
      name,
      description,
      variable,
      unit
    );

    await expect(
      repo.createSensor(
        networkCode,
        gatewayMac,
        sensorMac,
        "Another name",
        "Another description",
        "humidity",
        "%"
      )
    ).rejects.toThrow(ConflictError);
  });

  it("get sensor by mac address: not found", async () => {
    await expect(
      repo.getSensorByMacAddress("nonexistent-mac")
    ).rejects.toThrow(NotFoundError);
  });

  it("update sensor", async () => {
  await createSensor();

  await repo.updateSensor(
    sensorMac,                  // existing mac
    "33:44:33:44:33:44",        // new valid mac
    "Updated Name",
    "Updated Description",
    "humidity",
    "%"
  );

  const updated = await TestDataSource.getRepository(SensorDAO).findOneBy({ macAddress: "33:44:33:44:33:44" });

  expect(updated).toBeTruthy();
  expect(updated?.macAddress).toBe("33:44:33:44:33:44");
  expect(updated?.name).toBe("Updated Name");
  expect(updated?.description).toBe("Updated Description");
  expect(updated?.variable).toBe("humidity");
  expect(updated?.unit).toBe("%");

  const oldSensor = await TestDataSource.getRepository(SensorDAO).findOneBy({ macAddress: sensorMac });
  expect(oldSensor).toBeNull();
  });


  it("update sensor: not found", async () => {
    await createNetworkAndGateway();
    await expect(
      repo.updateSensor(
        "nonexistent-mac",
        "new-mac",
        "Name",
        "Desc",
        "pressure",
        "Pa"
      )
    ).rejects.toThrow(NotFoundError);
  });

  it("delete sensor", async () => {
    await createSensor();

    await repo.deleteSensor(sensorMac);

    const found = await TestDataSource.getRepository(SensorDAO).findOneBy({ macAddress: sensorMac });
    expect(found).toBeNull();
  });

  it("delete sensor: not found", async () => {
    await createNetworkAndGateway();
    await expect(
      repo.deleteSensor("nonexistent-mac")
    ).rejects.toThrow(NotFoundError);
  });

  it("get all sensors", async () => {
    await createNetworkAndGateway();

    await repo.createSensor(networkCode, gatewayMac, "11:11:11:11:11:11", "S1", "desc1", "temp", "C");
    await repo.createSensor(networkCode, gatewayMac, "22:22:22:22:22:22", "S2", "desc2", "humidity", "%");

    const sensors = await repo.getAllSensors(gatewayMac);
    expect(sensors.length).toBe(2);
    const macs = sensors.map(s => s.macAddress);
    expect(macs).toContain("11:11:11:11:11:11");
    expect(macs).toContain("22:22:22:22:22:22");
  });
});