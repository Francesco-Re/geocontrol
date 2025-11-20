import { AppDataSource } from "@database";
import { Repository, UpdateResult } from "typeorm";
import { NetworkDAO } from "@dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";

export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find();
  }

  async getNetworkByCode(code: string): Promise<NetworkDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with code '${code}' not found`
    );
  }

  async createNetwork(
    code: string,
    name: string,
    description: string
  ): Promise<NetworkDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Nework with code '${code}' already exists`
    );

    return this.repo.save({
    code: code,
    name: name,
    description: description
    });
  }
  
  async updateNetwork(code: string, newCode: string, newName: string, newDescription: string): Promise<UpdateResult>{
      findOrThrowNotFound(
      await this.repo.find({where: {code}}),
      () => true,
      `Network with code '${code}' not found`
    );
    throwConflictIfFound(
      await this.repo.find({ where: { code: newCode } }),
      () => true,
      `Nework with code '${newCode}' already exists`
    );
    return this.repo.update({code : code}, {
        code: newCode,
        name: newName,
        description: newDescription});
  }



  async deleteNetwork(code: string): Promise<void> {
    await this.repo.remove(await this.getNetworkByCode(code));
  }
}
