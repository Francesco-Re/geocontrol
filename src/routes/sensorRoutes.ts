import { Router } from "express";
import AppError from "@models/errors/AppError";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  createSensor,
  deleteSensor,
  getAllSensors,
  getSensorByMacAddress,
  updateSensor
} from "@controllers/sensorController";
import { SensorFromJSON } from "@models/dto/Sensor";

const router = Router({ mergeParams: true });

/**
 * GET /networks/:networkCode/gateways/:gatewayMac/sensors
 * Get all sensors of a gateway (any authenticated user)
 */
router.get(
  "/",
  authenticateUser([UserType.Operator, UserType.Admin, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac } = req.params;
      const sensors = await getAllSensors(networkCode, gatewayMac);
      res.status(200).json(sensors);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /networks/:networkCode/gateways/:gatewayMac/sensors
 * Create a new sensor (Admin & Operator)
 */
router.post(
  "/",
  authenticateUser([UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac } = req.params;
      const sensorDTO = SensorFromJSON(req.body);
      await createSensor(networkCode, gatewayMac, sensorDTO);
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac
 * Get a specific sensor (any authenticated user)
 */
router.get(
  "/:sensorMac",
  authenticateUser([UserType.Operator, UserType.Admin, UserType.Viewer]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const sensor = await getSensorByMacAddress(networkCode, gatewayMac, sensorMac);
      res.status(200).json(sensor);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac
 * Update a sensor (Admin & Operator)
 */
router.patch(
  "/:sensorMac",
  authenticateUser([UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      const sensorDTO = SensorFromJSON(req.body);
      // Pass networkCode and gatewayMac too!
      await updateSensor(networkCode, gatewayMac, sensorMac, sensorDTO);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac
 * Delete a sensor (Admin & Operator)
 */
router.delete(
  "/:sensorMac",
  authenticateUser([UserType.Operator, UserType.Admin]),
  async (req, res, next) => {
    try {
      const { networkCode, gatewayMac, sensorMac } = req.params;
      await deleteSensor(networkCode, gatewayMac, sensorMac);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);


// For the /networks/:networkCode/gateways/:gatewayMac/sensors endpoint (GET, POST allowed)
router.all("/", (req, res) => {
  res.set("Allow", "GET,POST");
  res.status(405).json({ error: "Method Not Allowed" });
});

// For the /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac endpoint (GET, PATCH, DELETE allowed)
router.all("/:sensorMac", (req, res) => {
  res.set("Allow", "GET,PATCH,DELETE");
  res.status(405).json({ error: "Method Not Allowed" });
});

export default router;
