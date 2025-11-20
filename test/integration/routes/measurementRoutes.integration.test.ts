import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as measurementController from "@controllers/measurementController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { Measurements as MeasurementsDTO } from "@dto/Measurements";

jest.mock("@services/authService");
jest.mock("@controllers/measurementController");

describe("MeasurementRoutes integration", () => {
    const token = "Bearer faketoken";
    const networkCode = "net-1";
    const gatewayMac = "gw-mac";
    const sensorMac = "sensor-mac";
    const baseSensorUrl = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`;
    const baseNetworkUrl = `/api/v1/networks/${networkCode}`;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("get sensor measurements", async () => {
        const mockMeasurements: MeasurementsDTO = { sensorMacAddress: sensorMac, measurements: [{ createdAt: new Date("2025-05-30T12:00:00.000Z"), value: 42, isOutlier: false }], stats: undefined };
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getSensorMeasurements as jest.Mock).mockResolvedValue(mockMeasurements);

        const response = await request(app)
            .get(`${baseSensorUrl}/measurements`)
            .set("Authorization", token);

        expect(response.status).toBe(200);
        expect(response.body.sensorMacAddress).toEqual(mockMeasurements.sensorMacAddress);
        expect(response.body.measurements[0].value).toEqual(mockMeasurements.measurements[0].value);     
        expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Viewer, UserType.Operator, UserType.Admin]);
        expect(measurementController.getSensorMeasurements).toHaveBeenCalled();
    });

    it("get sensor measurements: 401 UnauthorizedError", async () => {
        (authService.processToken as jest.Mock).mockImplementation(() => {
            throw new UnauthorizedError("Unauthorized: No token provided");
        });
        const response = await request(app)
            .get(`${baseSensorUrl}/measurements`)
            .set("Authorization", "Bearer invalid");
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("get sensor measurements: 403 InsufficientRightsError", async () => {
        (authService.processToken as jest.Mock).mockImplementation(() => {
            throw new InsufficientRightsError("Forbidden: Insufficient rights");
        });
        const response = await request(app)
            .get(`${baseSensorUrl}/measurements`)
            .set("Authorization", token);
        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/Insufficient rights/);
    });  

    it("post sensor measurements", async () => {
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.createMeasurement as jest.Mock).mockResolvedValue(undefined);
        const measurement = { createdAt: "2025-05-30T12:00:00.000Z", value: 55.5 };
        const response = await request(app)
            .post(`${baseSensorUrl}/measurements`)
            .set("Authorization", token)
            .send([measurement]);
        expect(response.status).toBe(201);
        expect(measurementController.createMeasurement).toHaveBeenCalled();
    });

    it("get network measurements", async () => {
        const mockMeasurements = [
            { sensorMacAddress: "sensor-mac-1", measurements: [{ createdAt: "2025-05-30T12:00:00.000Z", value: 42, isOutlier: false }], stats: undefined },
            { sensorMacAddress: "sensor-mac-2", measurements: [{ createdAt: "2025-05-30T12:00:00.000Z", value: 43, isOutlier: false }], stats: undefined }
        ];
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue(mockMeasurements);
        const response = await request(app)
            .get(`${baseNetworkUrl}/measurements?sensorMacs=sensor-mac-1,sensor-mac-2`)
            .set("Authorization", token);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockMeasurements);
        expect(measurementController.getNetworkMeasurements).toHaveBeenCalled();
    });

    it("get network statistics", async () => {
        const mockStats = [
            { mean: 42, variance: 0, upperThreshold: 44, lowerThreshold: 40 },
            { mean: 43, variance: 1, upperThreshold: 45, lowerThreshold: 41 }
        ];
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getNetworkStatistics as jest.Mock).mockResolvedValue(mockStats);
        const response = await request(app)
            .get(`${baseNetworkUrl}/stats?sensorMacs=sensor-mac-1,sensor-mac-2`)
            .set("Authorization", token);
        expect(response.status).toBe(200);
        expect(response.body[0].stats).toEqual(mockStats[0]);
        expect(response.body[1].stats).toEqual(mockStats[1]);
        expect(measurementController.getNetworkStatistics).toHaveBeenCalled();
    });

    it("get network outliers", async () => {
        const mockOutliers = [
            { sensorMacAddress: "sensor-mac-1", measurements: [{ createdAt: "2025-05-30T12:00:00.000Z", value: 100, isOutlier: true }], stats: undefined },
            { sensorMacAddress: "sensor-mac-2", measurements: [{ createdAt: "2025-05-30T12:00:00.000Z", value: 101, isOutlier: true }], stats: undefined }
        ];
        (authService.processToken as jest.Mock).mockResolvedValue(undefined);
        (measurementController.getNetworkOutliers as jest.Mock).mockResolvedValue(mockOutliers);
        const response = await request(app)
            .get(`${baseNetworkUrl}/outliers?sensorMacs=sensor-mac-1,sensor-mac-2`)
            .set("Authorization", token);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockOutliers);
        expect(measurementController.getNetworkOutliers).toHaveBeenCalled();
    });
});
