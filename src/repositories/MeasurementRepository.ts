import { AppDataSource } from "@database";
import { Repository, Between } from "typeorm";
import { MeasurementDAO } from "@dao/MeasurementDAO";
import { SensorDAO } from "@dao/SensorDAO"
import { NetworkDAO } from "@dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";

export class MeasurementRepository {
    private repo: Repository<MeasurementDAO>;

    constructor () {
        this.repo = AppDataSource.getRepository(MeasurementDAO)
    }

    async getAllSensorMeasurements (
        networkCode : string,
        gatewayMacAddress : string,
        sensorMacAddress : string,
        startDate : Date,
        endDate : Date
    ): Promise<MeasurementDAO[]> {
        const sensorRepo: Repository<SensorDAO> = AppDataSource.getRepository(SensorDAO);
        const sensors = await sensorRepo.find({
            where: {
            macAddress: sensorMacAddress,
            gateway: {
                macAdress: gatewayMacAddress,
                network: {
                    code: networkCode
                }
            }
            }
        });

        findOrThrowNotFound(
            sensors,
            () => sensors.length > 0,
            `Sensor with MAC address '${sensorMacAddress}' not found in Gateway with MAC address '${gatewayMacAddress}' in Network with code '${networkCode}'`
        );

        const matchingMeasurements = await this.repo.find({ 
            where: { 
                sensor : {
                    macAddress : sensorMacAddress,
                    gateway : {
                        macAdress : gatewayMacAddress,
                        network : {
                            code : networkCode
                        }
                    }
                },
                createdAt: Between(
                    startDate,
                    endDate
                )
            } 
        });

        return matchingMeasurements;
    }

    async getAllNetworkMeasurements (
        networkCode : string,
        sensorMacAddress : string,
        startDate : Date,
        endDate : Date
    ): Promise<MeasurementDAO[]> {
        const sensorRepo: Repository<SensorDAO> = AppDataSource.getRepository(SensorDAO);
        const sensors = await sensorRepo.find({
            where: {
                macAddress: sensorMacAddress,
                gateway: {
                    network: {
                        code: networkCode
                    }
                }
            }
        });

        findOrThrowNotFound(
            sensors,
            () => sensors.length > 0,
            `Sensor with MAC address '${sensorMacAddress}' not found in Network with code '${networkCode}'`
        );

        const matchingMeasurements = await this.repo.find({
            where: { 
                sensor : {
                    macAddress : sensorMacAddress,
                    gateway : {network : {code : networkCode}}
                },
                createdAt: Between(startDate, endDate)
            }
        });

        return matchingMeasurements;
    }


    async createMeasurement (
        networkCode : string,
        gatewayMacAddress : string,
        sensorMacAddress : string,
        createdAt : Date,
        value : number
    ): Promise<MeasurementDAO> {
        throwConflictIfFound(
            await this.repo.find({where : {
                sensorMacAddress,
                createdAt
            }}),
            () => true,
            `Measurements with sensor MAC '${sensorMacAddress}' created at '${createdAt}' already exists`
        )

        const sensorRepo: Repository<SensorDAO> = AppDataSource.getRepository(SensorDAO);  
        let sensors : SensorDAO[] = [];
        findOrThrowNotFound(
            sensors = await sensorRepo.find({
                where: {
                    macAddress: sensorMacAddress,
                    gateway: {
                        macAdress: gatewayMacAddress,
                        network: {
                            code: networkCode
                        }
                    }
                }
            }),
            () => true,
            `Sensor with MAC address '${sensorMacAddress}' not found in Gateway with MAC address '${gatewayMacAddress}' in Network with code '${networkCode}'`
        );
        const sensor = sensors[0];

        return this.repo.save({
            sensor : sensor,
            createdAt : createdAt.toISOString(),
            value : value,
            isOutlier : false
        })
    }

    async getAllSensorMacAddressesOfNetwork(networkCode: string): Promise<string[]> {
        const networkRepo: Repository<NetworkDAO> = AppDataSource.getRepository(NetworkDAO);
        const network = await networkRepo.find({ where: { code: networkCode } });

        findOrThrowNotFound(
            network,
            () => network.length > 0,
            `Network with code '${networkCode}' not found`
        );

        const sensors = await AppDataSource.getRepository(SensorDAO).find({
            where: {
                gateway: { network: { code: networkCode } }
            },
            select: ["macAddress"]
        });

        return sensors.map(sensor => sensor.macAddress);
    }
}