import * as measurementController from "@controllers/measurementController";
import { MeasurementRepository } from "@repositories/MeasurementRepository";
import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { Stats as StatsDTO } from "@dto/Stats";

jest.mock("@repositories/MeasurementRepository");
jest.mock("@services/mapperService", () => ({
  mapMeasurementDAOToMeasurementsDTO: jest.fn().mockReturnValue({
    sensorMacAddress: "sensor-mac",
    measurements: [{ createdAt: new Date("2025-05-30T12:00:00Z"), value: 42, isOutlier: false }],
    stats: undefined
  }),
  mapMeasurementDAOToStatsDTO: jest.fn().mockReturnValue({
    mean: 42,
    variance: 0,
    upperThreshold: 44,
    lowerThreshold: 40
  }),
  mapMeasurementDAOToOnlyOutlierMeasurementsDTO: jest.fn().mockReturnValue({
    sensorMacAddress: "sensor-mac",
    measurements: [{ createdAt: new Date("2025-05-30T12:00:00Z"), value: 100, isOutlier: true }],
    stats: undefined
  })
}));

describe("MeasurementController integration", () => {
  const networkCode = "net-1";
  const gatewayMacAddress = "gw-mac";
  const sensorMacAddress = "sensor-mac";
  const startDate = new Date("2025-05-30T00:00:00Z");
  const endDate = new Date("2025-05-30T23:59:59Z");

  it("getSensorMeasurements: mapperService integration", async () => {
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getAllSensorMeasurements: jest.fn().mockResolvedValue([])
    }));

    const result = await measurementController.getSensorMeasurements(
      networkCode,
      gatewayMacAddress,
      sensorMacAddress,
      startDate,
      endDate
    );

    expect(result).toEqual({
      sensorMacAddress: "sensor-mac",
      measurements: [{ createdAt: new Date("2025-05-30T12:00:00Z"), value: 42, isOutlier: false }],
      stats: undefined
    });
  });

  it("getSensorStatistics: mapperService integration", async () => {
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getAllSensorMeasurements: jest.fn().mockResolvedValue([])
    }));

    const result = await measurementController.getSensorStatistics(
      networkCode,
      gatewayMacAddress,
      sensorMacAddress,
      startDate,
      endDate
    );

    expect(result).toEqual({
      mean: 42,
      variance: 0,
      upperThreshold: 44,
      lowerThreshold: 40
    });
  });

  it("getSensorOutliers: mapperService integration", async () => {
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getAllSensorMeasurements: jest.fn().mockResolvedValue([])
    }));

    const result = await measurementController.getSensorOutliers(
      networkCode,
      gatewayMacAddress,
      sensorMacAddress,
      startDate,
      endDate
    );

    expect(result).toEqual({
      sensorMacAddress: "sensor-mac",
      measurements: [{ createdAt: new Date("2025-05-30T12:00:00Z"), value: 100, isOutlier: true }],
      stats: undefined
    });
  });

  it("createMeasurement: repository integration", async () => {
    const mockCreateMeasurement = jest.fn().mockResolvedValue(undefined);
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      createMeasurement: mockCreateMeasurement
    }));

    const measurementDTO = {
      createdAt: new Date("2025-05-30T12:00:00Z"),
      value: 55.5
    };

    await expect(
      measurementController.createMeasurement(
        networkCode,
        gatewayMacAddress,
        sensorMacAddress,
        measurementDTO
      )
    ).resolves.toBeUndefined();
    expect(mockCreateMeasurement).toHaveBeenCalledWith(
      networkCode,
      gatewayMacAddress,
      sensorMacAddress,
      measurementDTO.createdAt,
      measurementDTO.value
    );
  });

  it("getNetworkMeasurements: mapperService integration", async () => {
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworkMeasurements: jest.fn().mockResolvedValue([])
    }));
    const sensorMacs = ["sensor-mac-1", "sensor-mac-2"];
    const expected = [
      {
        sensorMacAddress: "sensor-mac",
        measurements: [{ createdAt: new Date("2025-05-30T12:00:00Z"), value: 42, isOutlier: false }],
        stats: undefined
      },
      {
        sensorMacAddress: "sensor-mac",
        measurements: [{ createdAt: new Date("2025-05-30T12:00:00Z"), value: 42, isOutlier: false }],
        stats: undefined
      }
    ];
    const result = await measurementController.getNetworkMeasurements(
      networkCode,
      sensorMacs,
      startDate,
      endDate
    );
    expect(result).toEqual(expected);
  });

  it("getNetworkStatistics: mapperService integration", async () => {
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworkMeasurements: jest.fn().mockResolvedValue([])
    }));
    const sensorMacs = ["sensor-mac-1", "sensor-mac-2"];
    const expected = [
      {
        mean: 42,
        variance: 0,
        upperThreshold: 44,
        lowerThreshold: 40
      },
      {
        mean: 42,
        variance: 0,
        upperThreshold: 44,
        lowerThreshold: 40
      }
    ];
    const result = await measurementController.getNetworkStatistics(
      networkCode,
      sensorMacs,
      startDate,
      endDate
    );
    expect(result).toEqual(expected);
  });

  it("getNetworkOutliers: mapperService integration", async () => {
    (MeasurementRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworkMeasurements: jest.fn().mockResolvedValue([])
    }));
    const sensorMacs = ["sensor-mac-1", "sensor-mac-2"];
    const expected = [
      {
        sensorMacAddress: "sensor-mac",
        measurements: [{ createdAt: new Date("2025-05-30T12:00:00Z"), value: 100, isOutlier: true }],
        stats: undefined
      },
      {
        sensorMacAddress: "sensor-mac",
        measurements: [{ createdAt: new Date("2025-05-30T12:00:00Z"), value: 100, isOutlier: true }],
        stats: undefined
      }
    ];
    const result = await measurementController.getNetworkOutliers(
      networkCode,
      sensorMacs,
      startDate,
      endDate
    );
    expect(result).toEqual(expected);
  });
});
