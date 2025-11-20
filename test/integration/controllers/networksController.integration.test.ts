import {
  getAllNetwork,
  createNetwork,
  updateNetwork,
  deleteNetwork,
  getNetworkByCode,
} from "@controllers/networkController";

import { NetworkRepository } from "@repositories/NetworkRepository";

// MOCK esterni (se getAllGateways o mapNetworkDAOToDTO sono usati nel controller)
jest.mock("@repositories/NetworkRepository");
jest.mock("@controllers/gatewayController", () => ({
  getAllGateways: jest.fn().mockResolvedValue([]),
}));
jest.mock("@services/mapperService", () => ({
  mapNetworkDAOToDTO: jest.fn().mockImplementation((networkDAO, gateways) => ({
    ...networkDAO,
    gateways,
  })),
}));

describe("NetworkController coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllNetwork should return mapped networks", async () => {
    const fakeNetworks = [
      { code: "NET01", name: "Network One", description: "desc" },
      { code: "NET02", name: "Network Two", description: "desc2" },
    ];

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockResolvedValue(fakeNetworks), // attenzione: nome corretto!
    }));

    const result = await getAllNetwork();

    expect(result).toEqual([
      { ...fakeNetworks[0], gateways: [] },
      { ...fakeNetworks[1], gateways: [] },
    ]);
  });

  it("getNetwork should return single mapped network", async () => {
    const fakeNet = { code: "NET01", name: "Network One", description: "desc" };

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getNetworkByCode: jest.fn().mockResolvedValue(fakeNet),
    }));

    const result = await getNetworkByCode("NET01");

    expect(result).toEqual({ ...fakeNet, gateways: [] });
  });

  it("createNetwork should call repo with correct args", async () => {
    const spy = jest.fn();

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: spy,
    }));

    const dto = {
      code: "NET03",
      name: "New Network",
      description: "Test",
    };

    await createNetwork(dto);

    expect(spy).toHaveBeenCalledWith("NET03", "New Network", "Test");
  });

  it("updateNetwork should call repo with code and partial data", async () => {
    const spy = jest.fn();

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: spy,
    }));

    const updatedData = {
      name: "Updated Network",
    };

    await updateNetwork("NET01", "NET01", updatedData.name!, ""); // safe cast

    expect(spy).toHaveBeenCalledWith("NET01", "NET01", "Updated Network", "");
  });

  it("deleteNetwork should call repo with correct code", async () => {
    const spy = jest.fn();

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork: spy,
    }));

    await deleteNetwork("NET01");

    expect(spy).toHaveBeenCalledWith("NET01");
  });
});

//codice npm test -- test/integration/controllers/networksController.integration.test.ts