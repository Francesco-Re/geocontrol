import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource,
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("NetworkRepository: SQLite in-memory", () => {
  const repo = new NetworkRepository();

  it("create network", async () => {
    const result = await repo.createNetwork(
      "NET01",
      "Main Network",
      "description"
    );
    expect(result).toMatchObject({
      code: "NET01",
      name: "Main Network",
    });

    const found = await repo.getNetworkByCode("NET01");
    expect(found.code).toBe("NET01");
  });

  it("get network by code: not found", async () => {
    await expect(repo.getNetworkByCode("NOPE")).rejects.toThrow(NotFoundError);
  });

  it("create network: conflict", async () => {
    await repo.createNetwork("NET01", "Main Network", "description");

    await expect(
      repo.createNetwork("NET01", "Duplicated", "description")
    ).rejects.toThrow(ConflictError);
  });

  it("delete network", async () => {
    await repo.createNetwork("NET02", "To Be Deleted", "description");
    await repo.deleteNetwork("NET02");

    await expect(repo.getNetworkByCode("NET02")).rejects.toThrow(NotFoundError);
  });

  it("get all networks with gateways and sensors", async () => {
    await repo.createNetwork("NET01", "Network 1", "description");
    await repo.createNetwork("NET02", "Network 2", "description");

    const all = await repo.getAllNetworks();
    expect(all.length).toBe(2);
    expect(all[0]).toHaveProperty("gateways");
  });

  it("update network name and description", async () => {
    await repo.createNetwork("NET10", "Old Name", "Old Description");

    await repo.updateNetwork(
      "NET10",              // current code
      "NET10",              // new code (same)
      "Updated Name",       // new name
      "Updated Description" // new description
    );

    const updated = await repo.getNetworkByCode("NET10");
    expect(updated.name).toBe("Updated Name");
    expect(updated.description).toBe("Updated Description");
  });

  it("update network: not found", async () => {
    await expect(
      repo.updateNetwork(
        "UNKNOWN",       // current code (not found)
        "UNKNOWN",       // new code
        "Should Fail",   // new name
        ""               // new description
      )
    ).rejects.toThrow(NotFoundError);
  });
});
////codice npm test -- test\unit\repositories\NetworkRepository.db.test.ts
//test\unit\repositories\NetworkRepository.db.test.ts
//npm test -- test/unit/repositories/NetworkRepository.db.test.ts
