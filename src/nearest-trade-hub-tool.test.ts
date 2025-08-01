import { expect, it, describe, vi, beforeEach, afterEach } from "vitest";
import { findNearestTradeHubTool } from "./nearest-trade-hub-tool.js";
import { ESIClient } from "./esi-client.js";

// Mock the ESIClient
vi.mock("./esi-client.js", () => {
  return {
    ESIClient: vi.fn().mockImplementation(() => {
      return {
        getSolarSystemIds: vi.fn(),
        idsToNames: vi.fn(),
        calculateRouteWithDetails: vi.fn()
      };
    })
  };
});

describe("findNearestTradeHubTool", () => {
  let mockEsiClient: any;
  
  beforeEach(() => {
    // Reset the mock before each test
    mockEsiClient = new ESIClient();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should find the nearest trade hub successfully", async () => {
    // Mock the ESI client responses
    mockEsiClient.getSolarSystemIds.mockResolvedValue([
      { id: 30000142, name: "Jita" }
    ]);
    
    mockEsiClient.idsToNames.mockImplementation((ids: number[]) => {
      const names: any = {
        30000142: { id: 30000142, name: "Jita" },
        30002187: { id: 30002187, name: "Amarr" },
        30002510: { id: 30002510, name: "Rens" }
      };
      return Promise.resolve(ids.map(id => names[id]));
    });
    
    mockEsiClient.calculateRouteWithDetails.mockImplementation((originId: number, destId: number) => {
      // Mock different distances for different destinations
      if (destId === 30002187) { // Amarr system
        return Promise.resolve({
          route: [30000142, 30002187],
          jumps: 1,
          origin: { id: 30000142, name: "Jita" },
          destination: { id: 30002187, name: "Amarr" },
          flag: "shortest"
        });
      } else if (destId === 30002510) { // Rens system
        return Promise.resolve({
          route: [30000142, 30002510],
          jumps: 2,
          origin: { id: 30000142, name: "Jita" },
          destination: { id: 30002510, name: "Rens" },
          flag: "shortest"
        });
      }
      // For other destinations, return a longer route
      return Promise.resolve({
        route: [30000142, 30002187, 30002510, destId],
        jumps: 3,
        origin: { id: 30000142, name: "Jita" },
        destination: { id: destId, name: `System ${destId}` },
        flag: "shortest"
      });
    });

    const result = await findNearestTradeHubTool.execute({
      origin: "Jita"
    });
    
    const parsedResult = JSON.parse(result);
    
    expect(parsedResult.success).toBe(true);
    expect(parsedResult.nearestHub).toBeDefined();
    expect(parsedResult.nearestHub.hubInfo.name).toBe("Amarr VIII (Oris) - Emperor Family Academy");
    expect(parsedResult.nearestHub.distance.jumps).toBe(1);
  });

  it("should handle string origin correctly", async () => {
    mockEsiClient.getSolarSystemIds.mockResolvedValue([
      { id: 30000142, name: "Jita" }
    ]);
    
    mockEsiClient.idsToNames.mockImplementation((ids: number[]) => {
      const names: any = {
        30000142: { id: 30000142, name: "Jita" },
        30002187: { id: 30002187, name: "Amarr" }
      };
      return Promise.resolve(ids.map(id => names[id]));
    });
    
    mockEsiClient.calculateRouteWithDetails.mockResolvedValue({
      route: [30000142, 30002187],
      jumps: 1,
      origin: { id: 30000142, name: "Jita" },
      destination: { id: 30002187, name: "Amarr" },
      flag: "shortest"
    });

    const result = await findNearestTradeHubTool.execute({
      origin: "Jita"
    });
    
    expect(mockEsiClient.getSolarSystemIds).toHaveBeenCalledWith(["Jita"]);
    const parsedResult = JSON.parse(result);
    expect(parsedResult.success).toBe(true);
  });

  it("should handle numeric origin correctly", async () => {
    mockEsiClient.idsToNames.mockImplementation((ids: number[]) => {
      const names: any = {
        30000142: { id: 30000142, name: "Jita" },
        30002187: { id: 30002187, name: "Amarr" }
      };
      return Promise.resolve(ids.map(id => names[id]));
    });
    
    mockEsiClient.calculateRouteWithDetails.mockResolvedValue({
      route: [30000142, 30002187],
      jumps: 1,
      origin: { id: 30000142, name: "Jita" },
      destination: { id: 30002187, name: "Amarr" },
      flag: "shortest"
    });

    const result = await findNearestTradeHubTool.execute({
      origin: 30000142
    });
    
    expect(mockEsiClient.getSolarSystemIds).not.toHaveBeenCalled();
    const parsedResult = JSON.parse(result);
    expect(parsedResult.success).toBe(true);
  });

  it("should filter by maxJumps", async () => {
    mockEsiClient.getSolarSystemIds.mockResolvedValue([
      { id: 30000142, name: "Jita" }
    ]);
    
    mockEsiClient.idsToNames.mockImplementation((ids: number[]) => {
      const names: any = {
        30000142: { id: 30000142, name: "Jita" },
        30002187: { id: 30002187, name: "Amarr" },
        30002510: { id: 30002510, name: "Rens" }
      };
      return Promise.resolve(ids.map(id => names[id]));
    });
    
    mockEsiClient.calculateRouteWithDetails.mockImplementation((originId: number, destId: number) => {
      if (destId === 30002187) { // Amarr system - 1 jump
        return Promise.resolve({
          route: [30000142, 30002187],
          jumps: 1,
          origin: { id: 30000142, name: "Jita" },
          destination: { id: 30002187, name: "Amarr" },
          flag: "shortest"
        });
      } else if (destId === 30002510) { // Rens system - 2 jumps
        return Promise.resolve({
          route: [30000142, 30002510],
          jumps: 2,
          origin: { id: 30000142, name: "Jita" },
          destination: { id: 30002510, name: "Rens" },
          flag: "shortest"
        });
      }
      // For other destinations, return a longer route
      return Promise.resolve({
        route: [30000142, 30002187, 30002510, destId],
        jumps: 3,
        origin: { id: 30000142, name: "Jita" },
        destination: { id: destId, name: `System ${destId}` },
        flag: "shortest"
      });
    });

    const result = await findNearestTradeHubTool.execute({
      origin: "Jita",
      maxJumps: 1
    });
    
    const parsedResult = JSON.parse(result);
    
    expect(parsedResult.success).toBe(true);
    expect(parsedResult.nearestHub.distance.jumps).toBeLessThanOrEqual(1);
  });

  it("should handle includeSecondaryHubs option", async () => {
    mockEsiClient.getSolarSystemIds.mockResolvedValue([
      { id: 30000142, name: "Jita" }
    ]);
    
    mockEsiClient.idsToNames.mockImplementation((ids: number[]) => {
      const names: any = {
        30000142: { id: 30000142, name: "Jita" },
        30002187: { id: 30002187, name: "Amarr" },
        30002791: { id: 30002791, name: "Oursulaert" }
      };
      return Promise.resolve(ids.map(id => names[id]));
    });
    
    mockEsiClient.calculateRouteWithDetails.mockImplementation((originId: number, destId: number) => {
      if (destId === 30002187) { // Amarr system - primary hub
        return Promise.resolve({
          route: [30000142, 30002187],
          jumps: 1,
          origin: { id: 30000142, name: "Jita" },
          destination: { id: 30002187, name: "Amarr" },
          flag: "shortest"
        });
      } else if (destId === 30002791) { // Oursulaert system - secondary hub
        return Promise.resolve({
          route: [30000142, 30002791],
          jumps: 5,
          origin: { id: 30000142, name: "Jita" },
          destination: { id: 30002791, name: "Oursulaert" },
          flag: "shortest"
        });
      }
      return Promise.resolve({
        route: [30000142, destId],
        jumps: 10,
        origin: { id: 30000142, name: "Jita" },
        destination: { id: destId, name: `System ${destId}` },
        flag: "shortest"
      });
    });

    // Test with secondary hubs included
    const resultWithSecondary = await findNearestTradeHubTool.execute({
      origin: "Jita",
      includeSecondaryHubs: true
    });
    
    const parsedResultWithSecondary = JSON.parse(resultWithSecondary);
    expect(parsedResultWithSecondary.success).toBe(true);
    
    // Test with secondary hubs excluded
    const resultWithoutSecondary = await findNearestTradeHubTool.execute({
      origin: "Jita",
      includeSecondaryHubs: false
    });
    
    const parsedResultWithoutSecondary = JSON.parse(resultWithoutSecondary);
    expect(parsedResultWithoutSecondary.success).toBe(true);
  });

  it("should handle when no trade hubs are found within maxJumps", async () => {
    mockEsiClient.getSolarSystemIds.mockResolvedValue([
      { id: 30000142, name: "Jita" }
    ]);
    
    mockEsiClient.idsToNames.mockImplementation((ids: number[]) => {
      return Promise.resolve(ids.map(id => ({ id, name: `System ${id}` })));
    });
    
    mockEsiClient.calculateRouteWithDetails.mockResolvedValue({
      route: [30000142, 30002187],
      jumps: 10,
      origin: { id: 30000142, name: "Jita" },
      destination: { id: 30002187, name: "Amarr" },
      flag: "shortest"
    });

    const result = await findNearestTradeHubTool.execute({
      origin: "Jita",
      maxJumps: 1
    });
    
    const parsedResult = JSON.parse(result);
    expect(parsedResult.success).toBe(false);
    expect(parsedResult.message).toContain("No trade hubs found within 1 jumps");
  });

  it("should handle when origin system is not found", async () => {
    mockEsiClient.getSolarSystemIds.mockResolvedValue([]);

    const result = await findNearestTradeHubTool.execute({
      origin: "NonExistentSystem"
    });
    
    const parsedResult = JSON.parse(result);
    expect(parsedResult.success).toBe(false);
    expect(parsedResult.message).toContain("Origin system 'NonExistentSystem' not found");
  });
});