import { AppDataSource } from "@database";
import { Repository, UpdateResult } from "typeorm";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";

export class SensorRepository {
  private repo: Repository<SensorDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(SensorDAO);
  }

  async getAllSensors(gatewayMac: string): Promise<SensorDAO[]> {
    return this.repo.find({
      where: { gateway: { macAdress: gatewayMac } },
      relations: ["gateway"]
    });
  }

  async getSensorByMacAddress(macAddress: string): Promise<SensorDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with macAddress '${macAddress}' not found`
    );
  }

  async createSensor(
    networkCode: string,
    gatewayMac: string,
    macAddress: string,
    name: string,
    description: string,
    variable: string,
    unit: string
  ): Promise<SensorDAO> {

    throwConflictIfFound(
      await this.repo.find({ where: { macAddress, gateway: { macAdress: gatewayMac } } }),
      () => true,
      `Sensor with macAddress '${macAddress}' already exists in gateway '${gatewayMac}'`
    );

    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) {
      throw new Error(`Invalid MAC address format: '${macAddress}'`);
    }

    // Get gateway entity from DB, verify networkCode
    const gatewayRepo = AppDataSource.getRepository(GatewayDAO);
    const gateway = await gatewayRepo.findOne({
      where: { macAdress: gatewayMac, network: { code: networkCode } },
      relations: ["network"],
    });

    if (!gateway) {
      throw new Error(`Gateway with macAddress '${gatewayMac}' and networkCode '${networkCode}' not found`);
    }

    return this.repo.save({
      macAddress,
      name,
      description,
      variable,
      unit,
      gateway,
    });
  }

  async updateSensor(
    macAddress: string,
    newMacAddress: string,
    newName: string,
    newDescription: string,
    newVariable: string,
    newUnit: string
  ): Promise<UpdateResult> {
    findOrThrowNotFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with macAddress '${macAddress}' not found`
    );

    throwConflictIfFound(
      await this.repo.find({ where: { macAddress: newMacAddress } }),
      () => macAddress !== newMacAddress,
      `Sensor with macAddress '${newMacAddress}' already exists`
    );

    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(newMacAddress)) {
      throw new Error(`Invalid MAC address format: '${newMacAddress}'`);
    }

    return this.repo.update(
      { macAddress },
      {
        macAddress: newMacAddress,
        name: newName,
        description: newDescription,
        variable: newVariable,
        unit: newUnit,
      }
    );
  }

  async deleteSensor(macAddress: string): Promise<void> {
    const sensor = await this.getSensorByMacAddress(macAddress);
    await this.repo.remove(sensor);
  }
}
