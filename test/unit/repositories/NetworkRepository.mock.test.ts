import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
    }),
  },
}));

describe("NetworkRepository: mocked database", () => {
  const repo = new NetworkRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create network", async () => {
    mockFind.mockResolvedValue([]);

    const savedNetwork = new NetworkDAO();
    savedNetwork.code = "NET01";
    savedNetwork.name = "Network One";

    mockSave.mockResolvedValue(savedNetwork);

    const result = await repo.createNetwork(
      "NET01",
      "Network One",
      "description"
    );

    expect(result).toBeInstanceOf(NetworkDAO);
    expect(result.code).toBe("NET01");
    expect(result.name).toBe("Network One");
    expect(mockSave).toHaveBeenCalledWith({
      code: "NET01",
      name: "Network One",
      description: "description",
    });
  });

  it("create network: conflict", async () => {
    mockFind.mockResolvedValue([
      { code: "NET01", name: "Already Exists" } as NetworkDAO,
    ]);

    await expect(
      repo.createNetwork("NET01", "Another Label", "description")
    ).rejects.toThrow(ConflictError);
  });

  it("get network by code", async () => {
    const found = new NetworkDAO();
    found.code = "NET01";
    found.name = "My Network";

    mockFind.mockResolvedValue([found]);

    const result = await repo.getNetworkByCode("NET01");

    expect(result).toBe(found);
    expect(result.name).toBe("My Network");
  });

  it("get network by code: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.getNetworkByCode("NOPE")).rejects.toThrow(NotFoundError);
  });

  it("delete network", async () => {
    const network = new NetworkDAO();
    network.code = "NET01";
    network.name = "To Delete";

    mockFind.mockResolvedValue([network]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteNetwork("NET01");

    expect(mockRemove).toHaveBeenCalledWith(network);
  });
});

// npm test -- test/integration/controllers/networksController.integration.test.ts cambia route
