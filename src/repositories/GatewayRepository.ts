import { AppDataSource } from "@database";
import { Repository, UpdateResult } from "typeorm";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";

export class GatewayRepository {
  private repo: Repository<GatewayDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(GatewayDAO);
  }
  
  getAllGateways(networkCode: string): Promise<GatewayDAO[]> {
    return this.repo.find({ where: {network: {code: networkCode}} });
  }

  async getGatewayByMacAddress (macAdress: string): Promise<GatewayDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { macAdress } }),
      () => true,
      `Gateway with macAdress '${ macAdress}' not found`
    );
  }

  async createGateway(
    networkCode: string,
    macAdress: string,
    name: string,
    description: string
  ): Promise<GatewayDAO> {

    throwConflictIfFound(
      await this.repo.find({ where: { macAdress: macAdress, network: { code : networkCode} } }),
      () => true,
      `Gateway with macAdress '${macAdress}' already exists`
    );
    var macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAdress)) {  
      throw new Error(`Invalid MAC address format: '${macAdress}'`);
    }
    const netRep: Repository<NetworkDAO> = AppDataSource.getRepository(NetworkDAO);      
    const network = await netRep.findOneBy({ code: networkCode });
    
    return this.repo.save({
    macAdress: macAdress,
    name: name,
    description: description,
    network: network
    });
  }
  
  async updateGateway (macAdress: string, 
    newMacAdress: string,
    newName: string,
    newDescription: string
  ): Promise<UpdateResult>
  {
      findOrThrowNotFound(
      await this.repo.find({where:  {macAdress} }),
      () => true,
      `Gateway with macAdress '${macAdress}' not found`
    );

    throwConflictIfFound(
      await this.repo.find({ where: { macAdress: newMacAdress } }),
      () => true,
      `Gateway with macAdress '${newMacAdress}' already exists`
    );
    
    var macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(newMacAdress)) {  
      throw new Error(`Invalid MAC address format: '${newMacAdress}'`);
    }
    
    return this.repo.update( {macAdress : macAdress}, {
        macAdress: newMacAdress,
        name: newName,
        description: newDescription
      });
  }


  async deleteGateway (macAdress: string): Promise<void> {
    await this.repo.remove(await this.getGatewayByMacAddress(macAdress));
  }
}
