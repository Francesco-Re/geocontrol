import { Gateway as GatewayDTO, instanceOfGateway } from "@models/dto/Gateway";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapGatewayDAOToDTO, mapSensorDAOToDTO } from "@services/mapperService";
import { SensorRepository } from "@repositories/SensorRepository";
import AppError from "@models/errors/AppError";

export async function createGateway (networkCode: string, gatewayDTO: GatewayDTO) : Promise<void>
{
    if(typeof(gatewayDTO.macAddress) == 'undefined')
    {
        throw new AppError("BAD_REQUEST", 400);
    }
    const gatewRepo = new GatewayRepository();
    const netRepo  = new NetworkRepository();
    await netRepo.getNetworkByCode(networkCode);
    await gatewRepo.createGateway(networkCode, gatewayDTO.macAddress, gatewayDTO.name, gatewayDTO.description);
}

export async function getAllGateways(networkCode: string): Promise<GatewayDTO[]> {
    const gatewayRepo = new GatewayRepository();
    const gateways = await gatewayRepo.getAllGateways(networkCode);
    const sensorRepo = new SensorRepository();
    const netRepo  = new NetworkRepository();
    await netRepo.getNetworkByCode(networkCode);
    return Promise.all(
        gateways.map(async (gatewayDAO) => 
            mapGatewayDAOToDTO(
                gatewayDAO, 
                (await sensorRepo.getAllSensors(gatewayDAO.macAdress)).map(mapSensorDAOToDTO)
            )
        )
    );
}

export async function getGatewayByMacAddress(networkCode: string, macAdress: string): Promise<GatewayDTO> {
    const gatewayRepo = new GatewayRepository();
    const sensorRepo = new SensorRepository();
    const netRepo  = new NetworkRepository();
    await netRepo.getNetworkByCode(networkCode);
    return mapGatewayDAOToDTO(await gatewayRepo.getGatewayByMacAddress(macAdress), (await sensorRepo.getAllSensors(macAdress)).map(mapSensorDAOToDTO));
}



export async function updateGateway(networkCode: string, macAdress: string, gatewayDTO: GatewayDTO)
{
    if(typeof(gatewayDTO.macAddress) == 'undefined')
    {
        throw new AppError("BAD_REQUEST", 400);
    }
    const gatewRepo = new GatewayRepository();
    const netRepo  = new NetworkRepository();
    await netRepo.getNetworkByCode(networkCode);
    await gatewRepo.updateGateway(macAdress, gatewayDTO.macAddress, gatewayDTO.name, gatewayDTO.description);
}

export async function deleteGateway(networkCode: string, macAddress: string): Promise<void> {
    const gatewRepo = new GatewayRepository();
    const netRepo  = new NetworkRepository();
    await netRepo.getNetworkByCode(networkCode);
    await gatewRepo.deleteGateway(macAddress);
}