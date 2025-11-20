import { Sensor as SensorDTO, instanceOfSensor } from "@models/dto/Sensor";
import { SensorRepository } from "@repositories/SensorRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import AppError from "@models/errors/AppError";

const sensorRepo = new SensorRepository();
const gatewayRepo = new GatewayRepository();
const networkRepo = new NetworkRepository();

export async function getAllSensors(networkCode: string, gatewayMac: string): Promise<SensorDTO[]> {
  // Validate network and gateway existence to ensure 404 if not found
  await networkRepo.getNetworkByCode(networkCode);
  await gatewayRepo.getGatewayByMacAddress(gatewayMac);

  const sensors = await sensorRepo.getAllSensors(gatewayMac);
  return sensors.map(sensor => ({
    macAddress: sensor.macAddress,
    name: sensor.name,
    description: sensor.description,
    variable: sensor.variable,
    unit: sensor.unit,
  }));
}

export async function getSensorByMacAddress(networkCode: string, gatewayMac: string, macAddress: string): Promise<SensorDTO> {
  // Validate network and gateway existence
  await networkRepo.getNetworkByCode(networkCode);
  await gatewayRepo.getGatewayByMacAddress(gatewayMac);

  const sensor = await sensorRepo.getSensorByMacAddress(macAddress);
  return {
    macAddress: sensor.macAddress,
    name: sensor.name,
    description: sensor.description,
    variable: sensor.variable,
    unit: sensor.unit,
  };
}

export async function createSensor(
  networkCode: string,
  gatewayMac: string,
  sensorDTO: SensorDTO
): Promise<void> {
  if (!sensorDTO.macAddress) {
    throw new AppError("Sensor macAddress is required", 400);
  }
  if (!instanceOfSensor(sensorDTO)) {
    throw new AppError("Invalid sensor data", 400);
  }

  await networkRepo.getNetworkByCode(networkCode); // validate network exists
  await gatewayRepo.getGatewayByMacAddress(gatewayMac); // validate gateway exists

  await sensorRepo.createSensor(
    networkCode,
    gatewayMac,
    sensorDTO.macAddress,
    sensorDTO.name ?? "",
    sensorDTO.description ?? "",
    sensorDTO.variable ?? "",
    sensorDTO.unit ?? ""
  );
}

export async function updateSensor(
  networkCode: string,
  gatewayMac: string,
  macAddress: string,
  sensorDTO: SensorDTO
): Promise<void> {
  if (!sensorDTO.macAddress) {
    throw new AppError("Sensor macAddress is required", 400);
  }
  if (!instanceOfSensor(sensorDTO)) {
    throw new AppError("Invalid sensor data", 400);
  }

  await networkRepo.getNetworkByCode(networkCode);
  await gatewayRepo.getGatewayByMacAddress(gatewayMac);

  await sensorRepo.updateSensor(
    macAddress,
    sensorDTO.macAddress,
    sensorDTO.name ?? "",
    sensorDTO.description ?? "",
    sensorDTO.variable ?? "",
    sensorDTO.unit ?? ""
  );
}

export async function deleteSensor(
  networkCode: string,
  gatewayMac: string,
  macAddress: string
): Promise<void> {
  await networkRepo.getNetworkByCode(networkCode);
  await gatewayRepo.getGatewayByMacAddress(gatewayMac);

  await sensorRepo.deleteSensor(macAddress);
}