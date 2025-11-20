import {Measurement as MeasurementDTO} from "@dto/Measurement"
import { Measurements as MeasurementsDTO } from "@dto/Measurements"
import { Stats as StatsDTO } from "@dto/Stats"
import { MeasurementRepository } from "@repositories/MeasurementRepository"
import { 
    mapMeasurementDAOToMeasurementsDTO,  
    mapMeasurementDAOToStatsDTO,
    mapMeasurementDAOToOnlyOutlierMeasurementsDTO 
} from "@services/mapperService";

export async function createMeasurement (networkCode : string, gatewayMacAddress : string, sensorMacAddress : string, measurementDTO : MeasurementDTO) : Promise<void> {
    const measurementRepo = new MeasurementRepository()
    await measurementRepo.createMeasurement(networkCode, gatewayMacAddress, sensorMacAddress, measurementDTO.createdAt, measurementDTO.value);
}

export async function getSensorMeasurements (networkCode : string, gatewayMacAddress : string, sensorMacAddress : string, startDate : Date, endDate : Date) : Promise<MeasurementsDTO> {
    const measurementRepo = new MeasurementRepository()
    const measurementDAOArray = await measurementRepo.getAllSensorMeasurements(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate)
    return mapMeasurementDAOToMeasurementsDTO(sensorMacAddress, measurementDAOArray, startDate, endDate)
}

export async function getSensorStatistics (networkCode : string, gatewayMacAddress : string, sensorMacAddress : string, startDate : Date, endDate : Date) : Promise<StatsDTO> {
    const measurementRepo = new MeasurementRepository();
    const measurementDAOArray = await measurementRepo.getAllSensorMeasurements(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate);
    return mapMeasurementDAOToStatsDTO(startDate, endDate, measurementDAOArray)
}

export async function getSensorOutliers (networkCode : string, gatewayMacAddress : string, sensorMacAddress : string, startDate : Date, endDate : Date) : Promise<MeasurementsDTO> {
    const measurementRepo = new MeasurementRepository();
    const measurementDAOArray = await measurementRepo.getAllSensorMeasurements(networkCode, gatewayMacAddress, sensorMacAddress, startDate, endDate);
    return mapMeasurementDAOToOnlyOutlierMeasurementsDTO(sensorMacAddress, measurementDAOArray, startDate, endDate)
}

export async function getNetworkMeasurements (networkCode : string, sensorMacs : string[], startDate : Date, endDate : Date) : Promise<MeasurementsDTO[]> {
    const measurementRepo = new MeasurementRepository()
    let macsToQuery = sensorMacs;
    if (!sensorMacs || sensorMacs.length === 0) {
        macsToQuery = await measurementRepo.getAllSensorMacAddressesOfNetwork(networkCode);
    }
    const measurementsDTOArray: MeasurementsDTO[] = await Promise.all(
        macsToQuery.map(async (sensorMacAddress) => {
            const measurementDAOArray = await measurementRepo.getAllNetworkMeasurements(networkCode, sensorMacAddress, startDate, endDate);
            return mapMeasurementDAOToMeasurementsDTO(sensorMacAddress, measurementDAOArray, startDate, endDate);
        })
    );
    return measurementsDTOArray;
}

export async function getNetworkStatistics (networkCode : string, sensorMacs : string[], startDate : Date, endDate : Date) : Promise<{ stats: StatsDTO[], macs: string[] }> {
    const measurementRepo = new MeasurementRepository();
    let macsToQuery = sensorMacs;
    if (!sensorMacs || sensorMacs.length === 0) {
        macsToQuery = await measurementRepo.getAllSensorMacAddressesOfNetwork(networkCode);
    }
    const statsDTOArray: StatsDTO[] = await Promise.all(
        macsToQuery.map(async (sensorMacAddress) => {
            const measurementDAOArray = await measurementRepo.getAllNetworkMeasurements(networkCode, sensorMacAddress, startDate, endDate);
            return mapMeasurementDAOToStatsDTO(startDate, endDate, measurementDAOArray);
        })
    );
    return {
        stats: statsDTOArray,
        macs: macsToQuery
    };
}

export async function getNetworkOutliers (networkCode : string, sensorMacs : string[], startDate : Date, endDate : Date) : Promise<MeasurementsDTO[]> {
    const measurementRepo = new MeasurementRepository();
    let macsToQuery = sensorMacs;
    if (!sensorMacs || sensorMacs.length === 0) {
        macsToQuery = await measurementRepo.getAllSensorMacAddressesOfNetwork(networkCode);
    }
    const measurementsDTOArray: MeasurementsDTO[] = await Promise.all(
        macsToQuery.map(async (sensorMacAddress) => {
            const measurementDAOArray = await measurementRepo.getAllNetworkMeasurements(networkCode, sensorMacAddress, startDate, endDate);
            return mapMeasurementDAOToOnlyOutlierMeasurementsDTO(sensorMacAddress, measurementDAOArray, startDate, endDate);
        })
    );
    return measurementsDTOArray;
}