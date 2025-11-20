import {Network as NetworkDTO} from "@dto/Network"
import { NetworkRepository } from "@repositories/NetworkRepository"
import { GatewayRepository } from "@repositories/GatewayRepository";
import { getAllGateways } from "@controllers/gatewayController";
import { mapNetworkDAOToDTO } from "@services/mapperService";

export async function createNetwork (networkDto : NetworkDTO) : Promise<void> {
    const networkRepo = new NetworkRepository();
    await networkRepo.createNetwork(networkDto.code, networkDto.name, networkDto.description);
}

export async function getAllNetwork(): Promise<NetworkDTO[]> {
    const networkRepo = new NetworkRepository();
    const networks = await networkRepo.getAllNetworks();
    return Promise.all(
        networks.map(async (networkDAO) => 
            mapNetworkDAOToDTO(
                networkDAO, 
                (await getAllGateways(networkDAO.code))
            )
        )
    );
}

export async function getNetworkByCode(code: string): Promise<NetworkDTO> {
  const networkRepo = new NetworkRepository();
    const gatewayRepo = new GatewayRepository();
  return mapNetworkDAOToDTO(await networkRepo.getNetworkByCode(code), (await getAllGateways(code)));
}

export async function updateNetwork(code: string, newCode: string, newName: string, newDescription: string): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.updateNetwork(code, newCode, newName, newDescription);
}

export async function deleteNetwork(code: string): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.deleteNetwork(code);
}


