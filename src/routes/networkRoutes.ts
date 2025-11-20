import AppError from "@models/errors/AppError";
import { Router } from "express";
import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";
import {
  createNetwork,
  deleteNetwork,
  getAllNetwork,
  updateNetwork,
  getNetworkByCode,
} from "@controllers/networkController"
import { Network, NetworkFromJSON } from "@models/dto/Network";

/*in order to complete the implementation (both for this element and for the others in the route folder)
 some files are needed to be created: 
  -Repository: works with the typeOrm, used to interact with the persistent database (for each class there is a repo file)
  -DAO class file: informations and methods implementation needed in the server, api doesn't access it
  -DTO class file: informations and methods used by the api
  -Controller: used to setup the methods used in the route methods, probably act as interface between api and server
  -mapper: conversion between dto and dao (mapperservice file can be leaved as one, each class has a specific mapping function)
  -routes file:typescript that uses the controller methods added with the specific name (/:networkCode) to make requests
  to the server through the API
  dependencies: routes->controller->repository+mapping->DAO+DTO class (already done + done automatically, may need
  some rework because i'm not 100% sure that it is done with DAO in other classes other than the user since there's
  no need to mask anything/hide implementation details for the other classes)
*/
const router = Router();

// Get all networks (Any authenticated user)
router.get("", authenticateUser([UserType.Viewer, UserType.Operator, UserType.Admin]), async (req, res, next) => {
  try {
    res.status(200).json(await getAllNetwork())
  }
  catch (error) {
    next(error)
  }
});

// Create a new network (Admin & Operator)
router.post(
  "", 
  authenticateUser([UserType.Operator, UserType.Admin]), 
  async (req, res, next) => {
    try {
      const parsed = NetworkFromJSON(req.body);

      // Validazione semplice e difensiva (puoi usare anche Zod/Joi)
      if (!parsed || !parsed.code || !parsed.name) {
        throw new AppError("Invalid payload: 'code' and 'name' are required", 400);
      }

      await createNetwork(parsed);
      res.status(201).json({ message: "Network created successfully" });
    }
    catch (error) {
      // Se è già un AppError, ha un codice specifico, altrimenti 500
      next(error);
    }
  }
);

// Get a specific network (Any authenticated user)
router.get("/:networkCode",authenticateUser([UserType.Viewer, UserType.Operator, UserType.Admin]),authenticateUser(), async (req, res, next) => {
  try {
    res.status(200).json(await getNetworkByCode(req.params.networkCode));
  } catch (error) {
    next (error);
  }
});

// Update a network (Admin & Operator) cambiato corrett
router.patch(
  "/:networkCode",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      const { code: newCode, name: newName, description: newDescription } = req.body;
      const currentCode = req.params.networkCode;

      // Verifica che ci sia almeno un campo da aggiornare
      if (!newCode && !newName && !newDescription) {
        throw new AppError("No field to update", 400);
      }

      await updateNetwork(currentCode, newCode, newName, newDescription);

      // Risposta 204 senza body
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);


// Delete a network (Admin & Operator)
router.delete(
  "/:networkCode",
  authenticateUser([UserType.Admin, UserType.Operator]),
  async (req, res, next) => {
    try {
      await deleteNetwork(req.params.networkCode);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
);



router.all("/", (req, res) => {
  res.set("Allow", "GET,POST");
  res.status(405).send({ error: "Method Not Allowed" });
});

router.all("/:gatewayMac", (req, res) => {
  res.set("Allow", "GET,PATCH,DELETE");
  res.status(405).send({ error: "Method Not Allowed" });
});



export default router;
