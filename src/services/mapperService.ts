import { Token as TokenDTO } from "@dto/Token";
import {Network as NetworkDTO } from "@dto/Network"
import {Sensor as SensorDTO } from "@dto/Sensor"
import {Measurement as MeasurementDTO} from "@dto/Measurement"
import { Gateway as GatewayDTO } from "@models/dto/Gateway";
import { UserDAO } from "@models/dao/UserDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO"
import { User as UserDTO } from "@dto/User";
import {MeasurementDAO} from "@dao/MeasurementDAO"
import { Measurements as MeasurementsDTO} from "@dto/Measurements"
import { Stats as StatsDTO } from "@dto/Stats"
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";
import { SensorDAO } from "@models/dao/SensorDAO";

export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}

export function createUserDTO(
  username: string,
  type: UserType,
  password?: string
): UserDTO {
  return removeNullAttributes({
    username,
    type,
    password
  }) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}

export function createNetworkDTO(
  code: string,
  name: string,
  description: string,
  gateways: GatewayDTO[]
): NetworkDTO {
  return removeNullAttributes({
    code,
    name,
    description,
    gateways
  }) as NetworkDTO
}

export function mapNetworkDAOToDTO(networkDAO: NetworkDAO, gateways: GatewayDTO[]): NetworkDTO {
  return createNetworkDTO(networkDAO.code, networkDAO.name, networkDAO.description, gateways);
}

export function createGatewayDTO(
  macAddress: string,
  name: string,
  description: string,
  sensors: SensorDTO[]
): GatewayDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    sensors
  }) as GatewayDTO
}

export function mapGatewayDAOToDTO(gatewayDAO: GatewayDAO, sensors: SensorDTO[]): GatewayDTO {
  return createGatewayDTO(gatewayDAO.macAdress, gatewayDAO.name, gatewayDAO.description, sensors)
}

export function createSensorDTO(
  macAddress: string,
  name: string,
  description: string,
  variable: string,
  unit: string,
): SensorDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    variable,
    unit
  }) as SensorDTO
}

export function mapSensorDAOToDTO(SensorDAO: SensorDAO): SensorDTO {
  return createSensorDTO(SensorDAO.macAddress, SensorDAO.name, SensorDAO.description,  SensorDAO.variable,  SensorDAO.unit);
}

export function createMeasurementDTO(
  createdAt,
  value,
  isOutlier
) : MeasurementDTO {
  return removeNullAttributes({
    createdAt,
    value,
    isOutlier
  }) as MeasurementDTO
}

export function mapMeasurementDAOToDTO(measurementDAO: MeasurementDAO): MeasurementDTO {
  return createMeasurementDTO(measurementDAO.createdAt, measurementDAO.value, measurementDAO.isOutlier)
}

export function createStatsDTO (
  startDate,
  endDate,
  mean,
  variance,
  upperThreshold,
  lowerThreshold
) : StatsDTO {
  return removeNullAttributes({
    startDate,
    endDate,
    mean,
    variance,
    upperThreshold,
    lowerThreshold
  }) as StatsDTO
}

export function mapMeasurementDAOToStatsDTO (startDate: Date, endDate : Date, measurementDAO : MeasurementDAO[]) : StatsDTO {
  const mean = measurementDAO.length > 0 
  ?  measurementDAO.reduce((acc, measurement) => acc + measurement.value, 0) / measurementDAO.length
  : 0;

  const variance = measurementDAO.length > 0
    ? measurementDAO.reduce((acc, measurement) => acc + Math.pow(measurement.value - mean, 2), 0) / (measurementDAO.length)
    : 0
  
  let upperThreshold : number, lowerThreshold : number;

  if (mean) {
    upperThreshold = mean + 2 * Math.sqrt(variance);
    lowerThreshold = mean - 2 * Math.sqrt(variance)
  }
  else {
    upperThreshold = 0;
    lowerThreshold = 0
  }

  measurementDAO.forEach((singleMeasurement) => {
    if (singleMeasurement.value > upperThreshold || singleMeasurement.value < lowerThreshold)
      singleMeasurement.isOutlier = true;
    else
      singleMeasurement.isOutlier = false
  })

    return createStatsDTO(
      startDate,
      endDate,
      mean,
      variance,
      upperThreshold,
      lowerThreshold
    );
}

export function createMeasurementsDTO (
  sensorMacAddress,
  stats,
  measurements
) : MeasurementsDTO {
  return removeNullAttributes ({
    sensorMacAddress,
    stats,
    measurements
  }) as MeasurementsDTO
}

export function mapMeasurementDAOToMeasurementsDTO (sensorMacAddress: string, measurementDAO: MeasurementDAO[], startDate: Date, endDate: Date): MeasurementsDTO {
  const stats = mapMeasurementDAOToStatsDTO(startDate, endDate, measurementDAO)
  measurementDAO.forEach((measurement) => {
    if (measurement.value > stats.upperThreshold || measurement.value < stats.lowerThreshold)
      measurement.isOutlier = true;
    else
      measurement.isOutlier = false
  })
  return createMeasurementsDTO(sensorMacAddress, stats, measurementDAO.map(mapMeasurementDAOToDTO));
}

export function mapMeasurementDAOToOnlyOutlierMeasurementsDTO (sensorMacAddress: string, measurementDAO: MeasurementDAO[], startDate: Date, endDate: Date): MeasurementsDTO {
  const stats = mapMeasurementDAOToStatsDTO(startDate, endDate, measurementDAO)
  measurementDAO.forEach((measurement) => {
    if (measurement.value > stats.upperThreshold || measurement.value < stats.lowerThreshold)
      measurement.isOutlier = true;
    else
      measurement.isOutlier = false
  })
  const outlierMeasurements = measurementDAO.filter((measurement) => measurement.isOutlier);
  return createMeasurementsDTO(sensorMacAddress, stats, outlierMeasurements.map(mapMeasurementDAOToDTO))
}

function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}
