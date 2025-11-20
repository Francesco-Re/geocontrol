import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as networkController from "@controllers/networkController";
import { Network as NetworkDTO } from "@dto/Network";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/networkController");

describe("NetworkRoutes Integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /networks", () => {
    it("should return 200 and a list of networks", async () => {
      const mockNetworks: NetworkDTO[] = [
        { code: "NET01", name: "Network 1", description: "First network" },
        { code: "NET02", name: "Network 2", description: "Second network" },
      ];

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getAllNetwork as jest.Mock).mockResolvedValue(mockNetworks);

      const response = await request(app).get("/api/v1/networks").set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetworks);
      expect(authService.processToken).toHaveBeenCalledWith( token, expect.arrayContaining(["viewer", "operator", "admin"]));

      expect(networkController.getAllNetwork).toHaveBeenCalled();
    });

    it("should return 401 when unauthorized", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: Invalid token");
      });

      const response = await request(app).get("/api/v1/networks").set("Authorization", "Bearer invalid");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("should return 500 on internal server error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getAllNetwork as jest.Mock).mockImplementation(() => {
        throw new Error("Internal server error");
      });

      const response = await request(app).get("/api/v1/networks").set("Authorization", token);

      expect(response.status).toBe(500);
      expect(response.body.message).toMatch(/Internal server error/);
    });
  });

  describe("POST /networks", () => {
    it("should create a network and return 201", async () => {
      const newNetwork = { code: "NET01", name: "New Network", description: "Description of new network" };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).post("/api/v1/networks").send(newNetwork).set("Authorization", token);

      expect(response.status).toBe(201);
      expect(authService.processToken).toHaveBeenCalledWith( token, expect.arrayContaining(["admin", "operator"]));
      expect(networkController.createNetwork).toHaveBeenCalledWith(newNetwork);
    });

    it("should return 409 if the network code already exists", async () => {
      const newNetwork = { code: "NET01", name: "New Network", description: "Description of new network" };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.createNetwork as jest.Mock).mockImplementation(() => {
        throw new ConflictError("Entity with code NET01 already exists");
      });

      const response = await request(app).post("/api/v1/networks").send(newNetwork).set("Authorization", token);

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/already exists/);
    });

    it("should return 403 if insufficient rights", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden: Insufficient rights");
      });

      const response = await request(app).post("/api/v1/networks").set("Authorization", token);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Insufficient rights/);
    });
  });

  describe("GET /networks/:networkCode", () => {
    it("should return 200 and the specified network", async () => {
      const mockNetwork = { code: "NET01", name: "Network 1", description: "First network" };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getNetworkByCode as jest.Mock).mockResolvedValue(mockNetwork);

      const response = await request(app).get("/api/v1/networks/NET01").set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNetwork);
      expect(authService.processToken).toHaveBeenCalledWith( token, expect.arrayContaining(["viewer", "operator", "admin"]));
      expect(networkController.getNetworkByCode).toHaveBeenCalledWith("NET01");
    });

    it("should return 404 if the network does not exist", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.getNetworkByCode as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Entity not found");
      });

      const response = await request(app).get("/api/v1/networks/NET02").set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/Entity not found/);
    });
  });

  describe("PATCH /networks/:networkCode", () => {
    it("should update a network and return 200", async () => {
      const updatedNetwork = { code: "NET01", name: "Updated Network", description: "Updated Description" };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .patch("/api/v1/networks/NET01")
        .send(updatedNetwork)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(authService.processToken).toHaveBeenCalledWith(
  token,
  expect.arrayContaining(["operator", "admin"])
);
      expect(networkController.updateNetwork).toHaveBeenCalledWith(
      "NET01",
      "NET01",
      "Updated Network",
      "Updated Description");
    });

    it("should return 404 if the network does not exist", async () => {
      const updatedNetwork = { code: "NET01", name: "Updated Network", description: "Updated Description" };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Entity not found");
      });

      const response = await request(app)
        .patch("/api/v1/networks/NET02")
        .send(updatedNetwork)
        .set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/Entity not found/);
    });
  });

  describe("DELETE /networks/:networkCode", () => {
    it("should delete a network and return 200", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete("/api/v1/networks/NET01").set("Authorization", token);

      expect(response.status).toBe(200);
      expect(authService.processToken).toHaveBeenCalledWith(token, ["admin", "operator"]);
      expect(networkController.deleteNetwork).toHaveBeenCalledWith("NET01");
    });

    it("should return 404 if the network does not exist", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (networkController.deleteNetwork as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Entity not found");
      });

      const response = await request(app).delete("/api/v1/networks/NET02").set("Authorization", token);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/Entity not found/);
    });
  });
});

//codice npm test -- test/integration/routes/networkRoutes.integration.test.ts