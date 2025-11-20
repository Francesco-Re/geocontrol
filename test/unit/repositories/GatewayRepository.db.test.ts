import { GatewayRepository } from "@repositories/GatewayRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { UpdateResult } from "typeorm";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("GatewayRepository: SQLite in-memory", () => {
  const repo = new GatewayRepository();
  const gatewayMacErr = "gw-mac-1";
  const gatewayMac = "00:00:00:00:00:00";
  const gatewayMacNew = "35:6C:11:69:24:AA"
  const networkCode = "net-1";
  const gatewayName = "Gateway"
  const gatewayDescription = "Test suite gateway"

  async function createNetwork() {
    // Create a network
    const network = TestDataSource.getRepository(NetworkDAO).create({
      code: networkCode,
      name: "Test Network",
      description: "A test network"
    });
    await TestDataSource.getRepository(NetworkDAO).save(network);
    return network;
  }


  //Gateway creation test suite
  it("create gateway", async () => {
    await createNetwork();
    const gateway = await repo.createGateway(networkCode, gatewayMac, gatewayName, gatewayDescription);
    expect(gateway).toMatchObject({
      macAdress: gatewayMac,
      network: { code: networkCode },
      name: gatewayName,
      description: gatewayDescription
    });
    const found = await TestDataSource.getRepository(GatewayDAO).findOne({
      where: { macAdress: gatewayMac, network: {code: networkCode} }
    });
    expect(found).toBeTruthy();
    expect(found.description).toBe(gatewayDescription);
    expect(found.name).toBe(gatewayName);
  });

  it("create gateway: wrong mac format", async () => {
    await createNetwork();
    await expect(repo.createGateway(networkCode, gatewayMacErr, gatewayName, gatewayDescription)).rejects.toThrow();
  });

  it("create gateway: already existing error", async () => {
    await createNetwork();
    await repo.createGateway(networkCode, gatewayMac, gatewayName, gatewayDescription);
    await expect(repo.createGateway(networkCode, gatewayMac, gatewayName, gatewayDescription)).rejects.toThrow(ConflictError);
  });


  //Gateway edit test suite
  it("edit gateway", async () => {
    const network = await createNetwork();
    const gateway = TestDataSource.getRepository(GatewayDAO).create({
      macAdress: gatewayMac,
      name: "Test Gateway",
      description: "A test gateway",
      network: network
    });
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    await expect(repo.updateGateway(gatewayMac, gatewayMacNew, gatewayName, gatewayDescription)).resolves.toBeInstanceOf(UpdateResult);
  });

  it("edit gateway: wrong mac format", async () => {
    const network = await createNetwork();
    const gateway = TestDataSource.getRepository(GatewayDAO).create({
      macAdress: gatewayMac,
      name: "Test Gateway",
      description: "A test gateway",
      network: network
    });
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    await expect(repo.updateGateway(gatewayMac, gatewayMacErr, gatewayName, gatewayDescription)).rejects.toThrow(Error(`Invalid MAC address format: '${gatewayMacErr}'`));
  });

  it("edit gateway: mac already existing", async () => {
    const network = await createNetwork();
    const gateway = TestDataSource.getRepository(GatewayDAO).create({
      macAdress: gatewayMac,
      name: "Test Gateway",
      description: "A test gateway",
      network: network
    });
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    await expect(repo.updateGateway(gatewayMac, gatewayMac, gatewayName, gatewayDescription)).rejects.toThrow(ConflictError);
  });

  //Gateway get test suite
  it("get gateway", async () => {
    const network = await createNetwork();
    const gateway = TestDataSource.getRepository(GatewayDAO).create({
      macAdress: gatewayMac,
      name: gatewayName,
      description: gatewayDescription,
      network: network
    });
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    const found = await repo.getGatewayByMacAddress(gatewayMac);
    expect(found).toBeTruthy();
    expect(found.description).toBe(gatewayDescription);
    expect(found.name).toBe(gatewayName);
  });
  
  it("get gateway: not found", async () => {
    await expect(
      repo.getGatewayByMacAddress(gatewayMac)
    ).rejects.toThrow(NotFoundError);
  });
  

  //Gateway getAll test suite
  it("getAll gateway", async () => {
    const network = await createNetwork();
    let gateway = TestDataSource.getRepository(GatewayDAO).create({
          macAdress: gatewayMac,
          name: gatewayName,
          description: gatewayDescription,
          network: network
        });
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    gateway = TestDataSource.getRepository(GatewayDAO).create({
          macAdress: gatewayMacNew,
          name: "TestGateway2",
          description: gatewayDescription,
          network: network
        });
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    let found = await repo.getAllGateways(networkCode);
    expect(found).toBeTruthy();
    expect(found.length).toBe(2);
    expect(found[0].macAdress).toBe(gatewayMac);
    expect(found[1].macAdress).toBe(gatewayMacNew);
    expect(found[0].description).toBe(gatewayDescription);
    expect(found[1].description).toBe(gatewayDescription);
  });

  //Gateway delete test suite
  it("delete gateway", async () => {
    const network = await createNetwork();
    await createNetwork();
    const gateway = TestDataSource.getRepository(GatewayDAO).create({
          macAdress: gatewayMac,
          name: "Test Gateway",
          description: "A test gateway",
          network: network
        });  
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
    await repo.deleteGateway(gatewayMac);
    expect(repo.getGatewayByMacAddress(gatewayMac)).rejects.toThrow(NotFoundError);
  });
});
