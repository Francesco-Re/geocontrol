import { CONFIG } from "@config";
import AppError from "@models/errors/AppError";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  createMeasurement,
  getSensorMeasurements,
  getSensorStatistics,
  getSensorOutliers,
  getNetworkMeasurements,
  getNetworkStatistics,
  getNetworkOutliers
} from "@controllers/measurementController"
import { MeasurementFromJSON } from "@dto/Measurement"

const router = Router();

// Store a measurement for a sensor (Admin & Operator)
router.post(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements",
  authenticateUser([UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    let errorOccurred = false;
    await Promise.all(req.body.map(async (measurement) => {
      try {
        await createMeasurement(
          req.params.networkCode,
          req.params.gatewayMac,
          req.params.sensorMac,
          MeasurementFromJSON(measurement)
      );
      } catch (error) {
        errorOccurred = true;
        next(error);
      }
    }));
    if (!errorOccurred) {
      res.status(201).send();
    }
  }
);

// Retrieve measurements for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/measurements",
  authenticateUser([UserType.Viewer, UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      res.status(200).json(await getSensorMeasurements(req.params.networkCode, req.params.gatewayMac, req.params.sensorMac, startDate, endDate))
    } catch (error) {
      next(error)
    }
  }
);

// Retrieve statistics for a specific sensor
router.get(CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/stats", 
  authenticateUser([UserType.Viewer, UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const stats = await getSensorStatistics(
        req.params.networkCode, 
        req.params.gatewayMac, 
        req.params.sensorMac,
        startDate,
        endDate
      );
      res.status(200).json({
        sensorMacAddress: req.params.sensorMac,
        ...stats
      });
    } catch (error) {
      next(error)
    }
  }
);

// Retrieve only outliers for a specific sensor
router.get(
  CONFIG.ROUTES.V1_SENSORS + "/:sensorMac/outliers",
  authenticateUser([UserType.Viewer, UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      res.status(200).json(await getSensorOutliers(req.params.networkCode, req.params.gatewayMac, req.params.sensorMac, startDate, endDate))
    } catch (error) {
      next(error)
    }
  }
);

// Retrieve measurements for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/measurements",
  authenticateUser([UserType.Viewer, UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const sensorMacs: string[] = typeof req.query.sensorMacs === "string" ? req.query.sensorMacs.split(",") : [];
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      res.status(200).json(await getNetworkMeasurements(req.params.networkCode, sensorMacs, startDate, endDate))
    } catch (error) {
      next(error)
    }
  }
);

// Retrieve statistics for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/stats",
  authenticateUser([UserType.Viewer, UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const sensorMacs: string[] = typeof req.query.sensorMacs === "string" ? req.query.sensorMacs.split(",") : [];
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const { stats, macs } = await getNetworkStatistics(req.params.networkCode, sensorMacs, startDate, endDate);
      const result = stats.map((stat: any, idx: number) => ({
        stats : stat,
        sensorMacAddress: macs[idx]
      }));
      res.status(200).json(result);
    } catch (error) {
      next(error)
    }
  }
);

// Retrieve only outliers for a set of sensors of a specific network
router.get(
  CONFIG.ROUTES.V1_NETWORKS + "/:networkCode/outliers",
  authenticateUser([UserType.Viewer, UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const sensorMacs: string[] = typeof req.query.sensorMacs === "string" ? req.query.sensorMacs.split(",") : [];
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(0);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      res.status(200).json(await getNetworkOutliers(req.params.networkCode, sensorMacs, startDate, endDate))
    } catch (error) {
      next(error)
    }
  }
);

export default router;
