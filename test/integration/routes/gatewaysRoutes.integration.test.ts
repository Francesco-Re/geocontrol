import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as gatewayController from "@controllers/gatewayController";
import { Gateway as GatewayDTO } from "@dto/Gateway";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/gatewayController");

describe("GatewayRoutes Integration", () => {
    const token = "Bearer faketoken";
    const networkCode = "NET01";

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/v1/networks/:networkCode/gateways", () => {
        it("should return 200 and a list of gateways", async () => {
            const mockGateways: GatewayDTO[] = [
                { macAddress: "MAC01", name: "Gateway 1", description: "First gateway" },
                { macAddress: "MAC02", name: "Gateway 2", description: "Second gateway" },
            ];

            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.getAllGateways as jest.Mock).mockResolvedValue(mockGateways);

            const response = await request(app).get(`/api/v1/networks/${networkCode}/gateways`).set("Authorization", token);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockGateways);
            expect(authService.processToken).toHaveBeenCalledWith(
                token,
                expect.arrayContaining(["viewer", "operator", "admin"])
            );
            expect(gatewayController.getAllGateways).toHaveBeenCalled();
        });

        it("should return 401 when unauthorized", async () => {
            (authService.processToken as jest.Mock).mockImplementation(() => {
                throw new UnauthorizedError("Unauthorized: Invalid token");
            });

            const response = await request(app).get(`/api/v1/networks/${networkCode}/gateways`).set("Authorization", "Bearer invalid");

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/Unauthorized/);
        });

        it("should return 500 on internal server error", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.getAllGateways as jest.Mock).mockImplementation(() => {
                throw new Error("Internal server error");
            });

            const response = await request(app).get(`/api/v1/networks/${networkCode}/gateways`).set("Authorization", token);

            expect(response.status).toBe(500);
            expect(response.body.message).toMatch(/Internal server error/);
        });
    });

    describe("POST /api/v1/networks/:networkCode/gateways", () => {
        it("should create a gateway and return 201", async () => {
            const newGateway = { macAddress: "MAC01", name: "New Gateway", description: "Description of new gateway" };

            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .send(newGateway)
                .set("Authorization", token);

            expect(response.status).toBe(201);
            expect(authService.processToken).toHaveBeenCalledWith(
                token,
                expect.arrayContaining(["admin", "operator"])
            );
            expect(gatewayController.createGateway).toHaveBeenCalledWith(networkCode, newGateway);
        });

        it("should return 409 if the gateway macAdress already exists", async () => {
            const newGateway = { macAdress: "MAC01", name: "New Gateway", description: "Description of new gateway" };

            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.createGateway as jest.Mock).mockImplementation(() => {
                throw new ConflictError("Entity with macAdress MAC01 already exists");
            });

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .send(newGateway)
                .set("Authorization", token);

            expect(response.status).toBe(409);
            expect(response.body.message).toMatch(/already exists/);
        });

        it("should return 403 if insufficient rights", async () => {
            (authService.processToken as jest.Mock).mockImplementation(() => {
                throw new InsufficientRightsError("Forbidden: Insufficient rights");
            });

            const response = await request(app)
                .post(`/api/v1/networks/${networkCode}/gateways`)
                .set("Authorization", token);

            expect(response.status).toBe(403);
            expect(response.body.message).toMatch(/Insufficient rights/);
        });
    });

    describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMacAdress", () => {
        it("should return 200 and the specified gateway", async () => {
            const mockGateway = { macAddress: "MAC01", name: "Gateway 1", description: "First gateway" };

            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.getGatewayByMacAddress as jest.Mock).mockResolvedValue(mockGateway);

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways/MAC01`)
                .set("Authorization", token);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockGateway);
            expect(authService.processToken).toHaveBeenCalledWith(
                token,
                expect.arrayContaining(["viewer", "operator", "admin"])
            );
            expect(gatewayController.getGatewayByMacAddress).toHaveBeenCalledWith("MAC01");
        });

        it("should return 404 if the gateway does not exist", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.getGatewayByMacAddress as jest.Mock).mockImplementation(() => {
                throw new NotFoundError("Entity not found");
            });

            const response = await request(app)
                .get(`/api/v1/networks/${networkCode}/gateways/MAC02`)
                .set("Authorization", token);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/Entity not found/);
        });
    });

    describe("PATCH /api/v1/networks/:networkCode/gateways/:gatewayMacAdress", () => {
        it("should update a gateway and return 204", async () => {
            const updatedGateway = { macAddress: "MAC01", name: "Updated Gateway", description: "Updated Description" };

            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/MAC01`)
                .send(updatedGateway)
                .set("Authorization", token);

            expect(response.status).toBe(204);
            expect(authService.processToken).toHaveBeenCalledWith(
                token,
                expect.arrayContaining(["operator", "admin"])
            );
            expect(gatewayController.updateGateway).toHaveBeenCalledWith(
                "MAC01",
                updatedGateway
            );
        });

        it("should return 404 if the gateway does not exist", async () => {
            const updatedGateway = { macAdress: "MAC01", name: "Updated Gateway", description: "Updated Description" };

            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.updateGateway as jest.Mock).mockImplementation(() => {
                throw new NotFoundError("Entity not found");
            });

            const response = await request(app)
                .patch(`/api/v1/networks/${networkCode}/gateways/MAC02`)
                .send(updatedGateway)
                .set("Authorization", token);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/Entity not found/);
        });
    });

    describe("DELETE /api/v1/networks/:networkCode/gateways/:gatewayMacAdress", () => {
        it("should delete a gateway and return 204", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .delete(`/api/v1/networks/${networkCode}/gateways/MAC01`)
                .set("Authorization", token);

            expect(response.status).toBe(204);
            expect(authService.processToken).toHaveBeenCalledWith(token, ["admin", "operator"]);
            expect(gatewayController.deleteGateway).toHaveBeenCalledWith("MAC01");
        });

        it("should return 404 if the gateway does not exist", async () => {
            (authService.processToken as jest.Mock).mockResolvedValue(undefined);
            (gatewayController.deleteGateway as jest.Mock).mockImplementation(() => {
                throw new NotFoundError("Entity not found");
            });

            const response = await request(app)
                .delete(`/api/v1/networks/${networkCode}/gateways/MAC02`)
                .set("Authorization", token);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/Entity not found/);
        });
    });
});

//codice npm test -- test/integration/routes/gatewayRoutes.integration.test.ts