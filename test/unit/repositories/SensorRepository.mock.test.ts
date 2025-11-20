import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockFindOne = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      update: mockUpdate,
      delete: mockDelete,
      findOne: mockFindOne,
      remove: mockRemove
    })
  }
}));

describe("SensorRepository: mocked database", () => {
  const repo = new SensorRepository();
  const sensorMac = "11:22:33:44:55:66";
  const gatewayMac = "AA:BB:CC:DD:EE:FF";
  const networkCode = "net-1";
  const name = "Sensor";
  const description = "Sensor description";
  const variable = "temperature";
  const unit = "C";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createSensor: success", async () => {
  mockFind.mockResolvedValue([]);
  const mockGateway = new GatewayDAO();
  mockGateway.macAdress = gatewayMac;
  const mockSensor = new SensorDAO();
  mockSensor.macAddress = sensorMac;

  mockFindOne.mockResolvedValue(mockGateway); // <--- FIXED
  mockSave.mockResolvedValue(mockSensor);

  const result = await repo.createSensor(
    networkCode,
    gatewayMac,
    sensorMac,
    name,
    description,
    variable,
    unit
  );

  expect(result).toBeInstanceOf(SensorDAO);
  expect(result.macAddress).toBe(sensorMac);
  expect(mockSave).toHaveBeenCalled();
  });

  it("createSensor: conflict", async () => {
    mockFind.mockResolvedValue([new SensorDAO()]);
    await expect(
      repo.createSensor(networkCode, gatewayMac, sensorMac, name, description, variable, unit)
    ).rejects.toThrow(ConflictError);
  });

 it("updateSensor: success", async () => {
  mockFind
    .mockResolvedValueOnce([new SensorDAO()]) // first find: existing sensor
    .mockResolvedValueOnce([]);               // second find: no MAC conflict

  mockUpdate.mockResolvedValue({ affected: 1 });

  const result = await repo.updateSensor(
    sensorMac,
    "33:44:33:44:33:44",
    "New Name",
    "New Desc",
    "humidity",
    "%"
  );

  expect(result.affected).toBe(1);
  expect(mockUpdate).toHaveBeenCalled();
});

  it("updateSensor: not found", async () => {
    mockFind.mockResolvedValue([]);
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

  it("deleteSensor: success", async () => {
  const sensor = new SensorDAO();
  mockFind.mockResolvedValue([sensor]);
  mockRemove.mockResolvedValue(undefined); // simulate successful deletion

  await expect(repo.deleteSensor(sensorMac)).resolves.toBeUndefined();
  expect(mockRemove).toHaveBeenCalledWith(sensor);
  });


  it("deleteSensor: not found", async () => {
    mockFind.mockResolvedValue([]);
    await expect(repo.deleteSensor("bad-mac")).rejects.toThrow(NotFoundError);
  });

  it("getSensorByMacAddress: found", async () => {
    const mockSensor = new SensorDAO();
    mockSensor.macAddress = sensorMac;
    mockFind.mockResolvedValue([mockSensor]);

    const result = await repo.getSensorByMacAddress(sensorMac);
    expect(result.macAddress).toBe(sensorMac);
  });

  it("getSensorByMacAddress: not found", async () => {
    mockFind.mockResolvedValue([]);
    await expect(
      repo.getSensorByMacAddress("missing-mac")
    ).rejects.toThrow(NotFoundError);
  });

  it("getAllSensors: returns sensors", async () => {
    const sensor1 = new SensorDAO();
    sensor1.macAddress = "sensor-1";
    const sensor2 = new SensorDAO();
    sensor2.macAddress = "sensor-2";
    mockFind.mockResolvedValue([sensor1, sensor2]);

    const result = await repo.getAllSensors(gatewayMac);
    expect(result.length).toBe(2);
    expect(result.map(s => s.macAddress)).toEqual(expect.arrayContaining(["sensor-1", "sensor-2"]));
  });
});