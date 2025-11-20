import { GatewayRepository } from "@repositories/GatewayRepository";
import {
    initializeTestDataSource,
    closeTestDataSource,
    TestDataSource,
} from "@test/setup/test-datasource";
import { GatewayDAO } from "@dao/GatewayDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { NetworkRepository } from "@repositories/NetworkRepository";

beforeAll(async () => {
    await initializeTestDataSource();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(GatewayDAO).clear();
});

describe("GatewayRepository: SQLite in-memory", () => {
    const repo = new GatewayRepository();
    const repoNet = new NetworkRepository();

    
    it("create gateway", async () => {
        const result = await repo.createGateway(
            "Net-1",
            "01:00:00:00:00:00",
            "Main Gateway",
            "description"
        );
        expect(result).toMatchObject({
            macAdress: "01:00:00:00:00:00",
            name: "Main Gateway",
        });

        const found = await repo.getGatewayByMacAddress("01:00:00:00:00:00");
        expect(found.macAdress).toBe("01:00:00:00:00:00");
    });

    it("get gateway by macAdress: not found", async () => {
        await expect(repo.getGatewayByMacAddress("NOPE")).rejects.toThrow(NotFoundError);
    });

    it("create gateway: conflict", async () => {
        await repoNet.createNetwork("Net-1", "Net", "Description");
        await repo.createGateway("Net-1", "01:00:00:00:00:00", "Main Gateway", "description");

        await expect(
            repo.createGateway("Net-1", "01:00:00:00:00:00", "Duplicated", "description")
        ).rejects.toThrow(ConflictError);
    });

    it("delete gateway", async () => {
        await repo.createGateway("Net-1", "02:00:00:00:00:00", "To Be Deleted", "description");
        await repo.deleteGateway("02:00:00:00:00:00");

        await expect(repo.getGatewayByMacAddress("02:00:00:00:00:00")).rejects.toThrow(NotFoundError);
    });

    it("get all gateways with gateways and sensors", async () => {
        await repo.createGateway("Net-1", "01:00:00:00:00:00", "Gateway 1", "description");
        await repo.createGateway("Net-1", "02:00:00:00:00:00", "Gateway 2", "description");

        const all = await repo.getAllGateways("Net-1");
        expect(all.length).toBe(2);
    });

    it("update gateway name and description", async () => {
        await repo.createGateway("Net-1", "10:00:00:00:00:00", "Old Name", "Old Description");

        await repo.updateGateway(
            "10:00:00:00:00:00",              // current macAdress
            "11:00:00:00:00:00",              // new macAdress
            "Updated Name",       // new name
            "Updated Description" // new description
        );

        const updated = await repo.getGatewayByMacAddress("11:00:00:00:00:00");
        expect(updated.name).toBe("Updated Name");
        expect(updated.description).toBe("Updated Description");
    });

    it("update gateway: not found", async () => {
        await expect(
            repo.updateGateway(
                "UNKNOWN",       // current macAdress (not found)
                "UNKNOWN",       // new macAdress
                "Should Fail",   // new name
                ""               // new description
            )
        ).rejects.toThrow(NotFoundError);
    });
})
